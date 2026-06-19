import 'server-only'

export const DIFY_API_BASE_URL = process.env.DIFY_API_BASE_URL || ''
const DIFY_AGENT_API_KEY_PREFIX = 'DIFY_APP_API_KEY_'

const normalizeAgentId = (agentId: string) => {
  const normalized = agentId.trim().toUpperCase()
  if (!normalized) {
    throw new Error('Missing Dify configuration: agent_id is required.')
  }
  if (!/^[A-Z0-9_]+$/.test(normalized)) {
    throw new Error(`Invalid agent_id '${agentId}'. Use uppercase letters, digits, and underscores only.`)
  }
  return normalized
}

export const formatAgentDisplayNameFromId = (agentId: string) => {
  return normalizeAgentId(agentId)
    .split('_')
    .filter(Boolean)
    .map(part => `${part.charAt(0)}${part.slice(1).toLowerCase()}`)
    .join(' ')
}

export const listConfiguredDifyAgentIds = () => {
  const configuredIds = Object.entries(process.env)
    .filter(([key, value]) => key.startsWith(DIFY_AGENT_API_KEY_PREFIX) && Boolean((value || '').trim()))
    .map(([key]) => key.replace(DIFY_AGENT_API_KEY_PREFIX, ''))
    .filter(Boolean)
    .map(id => normalizeAgentId(id))

  return Array.from(new Set(configuredIds)).sort()
}

export const hasDifyApiKeyForAgentId = (agentId: string) => {
  const normalized = normalizeAgentId(agentId)
  return Boolean((process.env[`${DIFY_AGENT_API_KEY_PREFIX}${normalized}`] || '').trim())
}

export const getDifyApiKeyForAgentId = (agentId: string) => {
  const normalized = normalizeAgentId(agentId)
  const key = (process.env[`${DIFY_AGENT_API_KEY_PREFIX}${normalized}`] || '').trim()
  if (!key) {
    throw new Error(`Missing Dify configuration: set ${DIFY_AGENT_API_KEY_PREFIX}${normalized} on the server.`)
  }
  return key
}

export const getSupabaseServerConfig = () => {
  const url = process.env.SUPABASE_PROJECT_URL || process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL || ''
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''

  if (!url || !publishableKey) {
    throw new Error('Missing Supabase configuration: set SUPABASE_PROJECT_URL and SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_PROJECT_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).')
  }

  return { url, publishableKey }
}

export const getSupabaseSecretKeyConfig = () => {
  const { url } = getSupabaseServerConfig()
  const secretKey = process.env.SUPABASE_SECRET_KEY || ''
  if (!secretKey) {
    throw new Error('Missing Supabase configuration: set SUPABASE_SECRET_KEY for admin APIs.')
  }
  return { url, secretKey }
}
