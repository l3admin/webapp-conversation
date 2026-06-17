import type { NextRequest } from 'next/server'
import { ChatClient } from 'dify-client'
import { createServerClient } from '@supabase/ssr'
import { DIFY_API_BASE_URL, getServerAgentConfigs, getSupabaseServerConfig } from '@/config/server'
import type { ServerAgentConfig } from '@/config/server'

const userPrefix = 'user:'
const cachedClients = new Map<string, ChatClient>()

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
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

  const user = userPrefix + authUser.id
  return {
    user,
    authUserId: authUser.id,
  }
}

const getAgentMap = () => {
  const map = new Map<string, ServerAgentConfig>()
  getServerAgentConfigs().forEach((agent) => {
    map.set(agent.id, agent)
  })
  return map
}

export const getAvailableAgents = () => {
  return getServerAgentConfigs().map(({ id, name }) => ({ id, name }))
}

export const getDefaultAgentId = () => {
  const agents = getServerAgentConfigs()
  return agents[0].id
}

export const resolveAgentId = (request: NextRequest, explicitAgentId?: string | null) => {
  const queryAgentId = new URL(request.url).searchParams.get('agent_id')
  const resolved = explicitAgentId || queryAgentId || getDefaultAgentId()
  const agentMap = getAgentMap()
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

  const agentMap = getAgentMap()
  const agent = agentMap.get(agentId)
  if (!agent) {
    const available = Array.from(agentMap.keys())
    throw new Error(`Unknown agent_id '${agentId}'. Available agents: ${available.join(', ')}`)
  }

  if (!agent.apiKey) {
    throw new Error(`Missing Dify configuration: API key is empty for agent_id '${agentId}'.`)
  }

  const cachedClient = cachedClients.get(agent.id)
  if (cachedClient) {
    return cachedClient
  }

  const client = new ChatClient(agent.apiKey, DIFY_API_BASE_URL)
  cachedClients.set(agent.id, client)
  return client
}
