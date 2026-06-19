import type { NextRequest } from 'next/server'
import { ChatClient } from 'dify-client'
import { createServerClient } from '@supabase/ssr'
import { DIFY_API_BASE_URL, formatAgentDisplayNameFromId, getDifyApiKeyForAgentId, hasDifyApiKeyForAgentId, listConfiguredDifyAgentIds, getSupabaseServerConfig } from '@/config/server'

const userPrefix = 'user:'
const cachedClients = new Map<string, ChatClient>()

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

type UserProfileRow = {
  user_id: string
  display_name: string | null
  first_name: string | null
  last_name: string | null
  initials_override: string | null
  avatar_url: string | null
  is_master_admin: boolean | null
  is_disabled: boolean | null
  must_change_password: boolean | null
  password_changed_at: string | null
}

export type ViewerProfile = {
  user_id: string
  display_name: string | null
  initials: string
  avatar_url: string | null
  is_master_admin: boolean
}

const extractInitials = (value: string) => {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
  if (parts.length === 0)
    return ''
  return parts.map(part => part[0] || '').join('').toUpperCase()
}

const deriveInitials = (profile: UserProfileRow, authEmail?: string | null) => {
  const normalizedOverride = (profile.initials_override || '').replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase()
  if (normalizedOverride)
    return normalizedOverride

  const normalizedDisplayName = extractInitials(profile.display_name || '')
  if (normalizedDisplayName)
    return normalizedDisplayName

  const normalizedFirstLastName = extractInitials(`${profile.first_name || ''} ${profile.last_name || ''}`)
  if (normalizedFirstLastName) {
    return normalizedFirstLastName
  }

  const emailInitial = (authEmail || '').trim().charAt(0).toUpperCase()
  return emailInitial || 'U'
}

const getOrCreateUserProfile = async (supabase: ReturnType<typeof createSupabaseRouteClient>, authUserId: string, authEmail?: string | null, authName?: string | null) => {
  const normalizedAuthName = (authName || '').trim()
  const [derivedFirstName, ...derivedLastNameParts] = normalizedAuthName ? normalizedAuthName.split(/\s+/) : []
  const derivedLastName = derivedLastNameParts.join(' ').trim() || null

  const { data: existingProfile, error: readError } = await supabase
    .from('user_profiles')
    .select('user_id,display_name,first_name,last_name,initials_override,avatar_url,is_master_admin,is_disabled,must_change_password,password_changed_at')
    .eq('user_id', authUserId)
    .maybeSingle()

  if (readError) {
    throw new Error(`Failed to read user profile. user_id=${authUserId} reason=${readError.message}`)
  }

  if (existingProfile) {
    return existingProfile as UserProfileRow
  }

  const insertPayload = {
    user_id: authUserId,
    first_name: derivedFirstName || null,
    last_name: derivedLastName,
    display_name: null,
    initials_override: null,
    avatar_url: null,
    is_master_admin: false,
    is_disabled: false,
    must_change_password: false,
    password_changed_at: null,
  }

  const { data: createdProfile, error: insertError } = await supabase
    .from('user_profiles')
    .insert(insertPayload)
    .select('user_id,display_name,first_name,last_name,initials_override,avatar_url,is_master_admin,is_disabled,must_change_password,password_changed_at')
    .single()

  if (insertError || !createdProfile) {
    throw new Error(`Failed to create user profile. user_id=${authUserId} reason=${insertError?.message || 'empty_insert_result'}`)
  }

  return createdProfile as UserProfileRow
}

const createSupabaseRouteClient = (request: NextRequest) => {
  const { url, publishableKey } = getSupabaseServerConfig()

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll() {},
    },
  })
}

export const getInfo = async (request: NextRequest) => {
  const supabase = createSupabaseRouteClient(request)
  const { data: { user: authUser }, error } = await supabase.auth.getUser()
  if (error || !authUser) {
    throw new AuthError(`Unauthorized Supabase session. reason=${error?.message || 'missing_user'}`)
  }

  const profile = await getOrCreateUserProfile(
    supabase,
    authUser.id,
    authUser.email || null,
    (authUser.user_metadata as Record<string, any> | null)?.full_name || null,
  )
  if (profile.is_disabled) {
    throw new AuthError(`User is disabled. user_id=${authUser.id}`)
  }
  if (profile.must_change_password) {
    throw new AuthError(`Password change required before access. user_id=${authUser.id}`)
  }

  const viewer: ViewerProfile = {
    user_id: authUser.id,
    display_name: profile.display_name,
    initials: deriveInitials(profile, authUser.email || null),
    avatar_url: profile.avatar_url,
    is_master_admin: Boolean(profile.is_master_admin),
  }

  const user = userPrefix + authUser.id
  return {
    supabase,
    user,
    authUserId: authUser.id,
    viewer,
  }
}

const getCustomerIdForUser = async (supabase: ReturnType<typeof createSupabaseRouteClient>, authUserId: string) => {
  const { data: accessRows, error } = await supabase
    .from('user_customer_access')
    .select('customer_id')
    .eq('user_id', authUserId)

  if (error) {
    throw new Error(`Failed to load user_customer_access. user_id=${authUserId} reason=${error.message}`)
  }
  if (!accessRows?.length) {
    throw new Error(`Missing customer access assignment. user_id=${authUserId}`)
  }

  const uniqueCustomerIds = Array.from(new Set(accessRows.map(row => row.customer_id).filter(Boolean)))
  if (uniqueCustomerIds.length !== 1) {
    throw new Error(`Expected exactly one customer assignment. user_id=${authUserId} customer_ids=${uniqueCustomerIds.join(',')}`)
  }
  return uniqueCustomerIds[0]
}

const getAgentsForMasterAdmin = async (supabase: ReturnType<typeof createSupabaseRouteClient>) => {
  const configuredAgentIds = listConfiguredDifyAgentIds()
  if (!configuredAgentIds.length) {
    throw new Error('No Dify agents are configured for admin access. Define DIFY_APP_API_KEY_<AGENT_ID> env variables.')
  }

  const { data: catalogRows, error: catalogError } = await supabase
    .from('agent_catalog')
    .select('agent_id,display_name,button_label,description,is_active')
    .in('agent_id', configuredAgentIds)

  if (catalogError) {
    throw new Error(`Failed to load agent catalog for master admin. reason=${catalogError.message}`)
  }

  const catalogById = new Map((catalogRows || []).map(row => [row.agent_id, {
    display_name: row.display_name || null,
    button_label: row.button_label || null,
    description: row.description || null,
    is_active: row.is_active,
  }]))
  const agents = configuredAgentIds.map((agentId) => {
    const catalog = catalogById.get(agentId)
    const hasUsableCatalogName = Boolean(catalog?.display_name && catalog.display_name.trim())
    const isCatalogActive = catalog?.is_active !== false
    return {
      id: agentId,
      name: hasUsableCatalogName && isCatalogActive ? catalog!.display_name! : formatAgentDisplayNameFromId(agentId),
      button_label: isCatalogActive ? (catalog?.button_label || null) : null,
      description: isCatalogActive ? (catalog?.description || null) : null,
    }
  })
  return {
    agents,
    defaultAgentId: configuredAgentIds[0],
  }
}

const getAgentsForCustomer = async (supabase: ReturnType<typeof createSupabaseRouteClient>, customerId: string) => {
  const { data: assignmentRows, error: assignmentError } = await supabase
    .from('customer_agent_access')
    .select('agent_id,is_default')
    .eq('customer_id', customerId)

  if (assignmentError) {
    throw new Error(`Failed to load customer_agent_access. customer_id=${customerId} reason=${assignmentError.message}`)
  }
  if (!assignmentRows?.length) {
    throw new Error(`No agent assignments configured for customer. customer_id=${customerId}`)
  }

  const assignmentAgentIds = assignmentRows.map(row => row.agent_id).filter(Boolean)
  const { data: catalogRows, error: catalogError } = await supabase
    .from('agent_catalog')
    .select('agent_id,display_name,button_label,description,is_active')
    .in('agent_id', assignmentAgentIds)

  if (catalogError) {
    throw new Error(`Failed to load agent_catalog for customer. customer_id=${customerId} reason=${catalogError.message}`)
  }
  if (!catalogRows?.length) {
    throw new Error(`Missing active agent catalog rows for customer assignments. customer_id=${customerId}`)
  }

  const activeCatalogRows = catalogRows.filter(row => row.is_active)
  const activeCatalogById = new Map(activeCatalogRows.map(row => [row.agent_id, row]))

  const missingOrInactiveAssignments = assignmentAgentIds.filter((agentId) => {
    return !activeCatalogById.has(agentId)
  })
  if (missingOrInactiveAssignments.length) {
    throw new Error(`Assigned agents are missing or inactive in agent_catalog. customer_id=${customerId} agent_ids=${missingOrInactiveAssignments.join(',')}`)
  }

  const missingServerConfigs = assignmentAgentIds.filter(agentId => !hasDifyApiKeyForAgentId(agentId))
  if (missingServerConfigs.length) {
    throw new Error(`Assigned agents are missing Dify API keys in server env. agent_ids=${missingServerConfigs.join(',')}`)
  }

  const agents = assignmentAgentIds.map((agentId) => {
    const catalog = activeCatalogById.get(agentId)
    if (!catalog) {
      throw new Error(`Missing catalog data for assigned agent. customer_id=${customerId} agent_id=${agentId}`)
    }
    return {
      id: catalog.agent_id,
      name: catalog.display_name,
      button_label: catalog.button_label || null,
      description: catalog.description || null,
    }
  })

  const defaultAssignments = assignmentRows.filter(row => row.is_default)
  if (defaultAssignments.length !== 1) {
    throw new Error(`Expected exactly one default agent per customer. customer_id=${customerId} found=${defaultAssignments.length}`)
  }

  const defaultAgentId = defaultAssignments[0]?.agent_id || ''
  if (!activeCatalogById.has(defaultAgentId)) {
    throw new Error(`Default agent is missing or inactive. customer_id=${customerId} agent_id=${defaultAgentId}`)
  }

  return {
    agents,
    defaultAgentId,
  }
}

export const getAvailableAgents = async (request: NextRequest, authUserId: string) => {
  const supabase = createSupabaseRouteClient(request)
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('is_master_admin')
    .eq('user_id', authUserId)
    .single()

  if (profileError || !profile) {
    throw new Error(`Failed to load user profile role for agent access. user_id=${authUserId} reason=${profileError?.message || 'missing_profile'}`)
  }
  if (profile.is_master_admin) {
    return getAgentsForMasterAdmin(supabase)
  }

  const customerId = await getCustomerIdForUser(supabase, authUserId)
  return getAgentsForCustomer(supabase, customerId)
}

export const resolveAgentId = async (request: NextRequest, authUserId: string, explicitAgentId?: string | null) => {
  const queryAgentId = new URL(request.url).searchParams.get('agent_id')
  const { agents, defaultAgentId } = await getAvailableAgents(request, authUserId)
  const resolved = explicitAgentId || queryAgentId || defaultAgentId
  const agentMap = new Map(agents.map(agent => [agent.id, agent]))
  if (!agentMap.has(resolved)) {
    const available = Array.from(agentMap.keys())
    throw new Error(`Unknown agent_id '${resolved}'. Available agents: ${available.join(', ')}`)
  }
  return resolved
}

export const getClient = (agentId: string) => {
  if (!DIFY_API_BASE_URL) {
    throw new Error('Missing Dify configuration: DIFY_API_BASE_URL is required on the server.')
  }
  const apiKey = getDifyApiKeyForAgentId(agentId)

  const normalizedAgentId = agentId.trim().toUpperCase()
  const cachedClient = cachedClients.get(normalizedAgentId)
  if (cachedClient) {
    return cachedClient
  }

  const client = new ChatClient(apiKey, DIFY_API_BASE_URL)
  cachedClients.set(normalizedAgentId, client)
  return client
}
