import type { IOnCompleted, IOnData, IOnError, IOnFile, IOnMessageEnd, IOnMessageReplace, IOnNodeFinished, IOnNodeStarted, IOnThought, IOnWorkflowFinished, IOnWorkflowStarted } from './base'
import { get, post, put, ssePost } from './base'
import type { AdminAgentAccessRow, AdminAgentCatalogItem, AdminCustomerItem, AdminOverview, AdminUserItem, AgentItem, Feedbacktype, UserProfile, ViewerProfile } from '@/types/app'

export const fetchAgents = async () => {
  return get('agents') as Promise<{ data: AgentItem[], default_agent_id: string, viewer: ViewerProfile, admin_debug?: { dify_base_url: string } | null }>
}

export const fetchProfile = async () => {
  return get('profile') as Promise<{ profile: UserProfile, viewer: ViewerProfile }>
}

export const updateProfile = async (payload: {
  first_name: string | null
  last_name: string | null
  display_name: string | null
  initials_override: string | null
  avatar_url: string | null
}) => {
  return put('profile', { body: payload }) as Promise<{ profile: UserProfile, viewer: ViewerProfile }>
}

export const updateMyPassword = async (payload: { password: string, current_password?: string }) => {
  return put('profile/password', { body: payload }) as Promise<{ data: { user_id: string, must_change_password: boolean, password_changed_at: string } }>
}

export const sendChatMessage = async (
  body: Record<string, any>,
  agentId: string,
  {
    onData,
    onCompleted,
    onThought,
    onFile,
    onError,
    getAbortController,
    onMessageEnd,
    onMessageReplace,
    onWorkflowStarted,
    onNodeStarted,
    onNodeFinished,
    onWorkflowFinished,
  }: {
    onData: IOnData
    onCompleted: IOnCompleted
    onFile: IOnFile
    onThought: IOnThought
    onMessageEnd: IOnMessageEnd
    onMessageReplace: IOnMessageReplace
    onError: IOnError
    getAbortController?: (abortController: AbortController) => void
    onWorkflowStarted: IOnWorkflowStarted
    onNodeStarted: IOnNodeStarted
    onNodeFinished: IOnNodeFinished
    onWorkflowFinished: IOnWorkflowFinished
  },
) => {
  return ssePost('chat-messages', {
    body: {
      ...body,
      agent_id: agentId,
      response_mode: 'streaming',
    },
  }, { onData, onCompleted, onThought, onFile, onError, getAbortController, onMessageEnd, onMessageReplace, onNodeStarted, onWorkflowStarted, onWorkflowFinished, onNodeFinished })
}

export const fetchConversations = async (agentId: string) => {
  return get('conversations', { params: { limit: 100, first_id: '', agent_id: agentId } })
}

export const fetchChatList = async (conversationId: string, agentId: string) => {
  return get('messages', { params: { conversation_id: conversationId, limit: 20, last_id: '', agent_id: agentId } })
}

// init value. wait for server update
export const fetchAppParams = async (agentId: string) => {
  return get('parameters', { params: { agent_id: agentId } })
}

export const updateFeedback = async ({ url, body, agentId }: { url: string, body: Feedbacktype, agentId: string }) => {
  return post(`${url}?agent_id=${encodeURIComponent(agentId)}`, { body })
}

export const generationConversationName = async (id: string, agentId: string) => {
  return post(`conversations/${id}/name?agent_id=${encodeURIComponent(agentId)}`, { body: { auto_generate: true } })
}

export const fetchAdminOverview = async () => {
  return get('admin/overview') as Promise<{ data: AdminOverview }>
}

export const fetchAdminUsers = async () => {
  return get('admin/users') as Promise<{ data: AdminUserItem[] }>
}

export const inviteAdminUser = async (payload: { email: string, password: string, first_name: string, last_name: string, display_name?: string | null, send_invite_email?: boolean }) => {
  return post('admin/users', { body: payload }) as Promise<{ data: AdminUserItem }>
}

export const updateAdminUserProfile = async (userId: string, payload: { first_name: string, last_name: string, display_name?: string | null }) => {
  return put(`admin/users/${encodeURIComponent(userId)}`, { body: payload }) as Promise<{ data: AdminUserItem }>
}

export const resetAdminUserPassword = async (userId: string, payload: { password: string }) => {
  return put(`admin/users/${encodeURIComponent(userId)}/password`, { body: payload }) as Promise<{ data: { user_id: string, must_change_password: boolean } }>
}

export const setAdminUserDisabled = async (userId: string, isDisabled: boolean) => {
  return put(`admin/users/${encodeURIComponent(userId)}/disable`, { body: { is_disabled: isDisabled } }) as Promise<{ data: { user_id: string, is_disabled: boolean } }>
}

export const assignUserCustomerAccess = async (payload: { user_id: string, customer_id: string, role: 'admin' | 'member' }) => {
  return post('admin/user-customer-access', { body: payload }) as Promise<{ data: { user_id: string, customer_id: string, role: string } }>
}

export const fetchAdminCustomers = async () => {
  return get('admin/customers') as Promise<{ data: AdminCustomerItem[] }>
}

export const createAdminCustomer = async (payload: { slug: string, display_name: string, status?: string }) => {
  return post('admin/customers', { body: payload }) as Promise<{ data: AdminCustomerItem }>
}

export const fetchAdminAgents = async () => {
  return get('admin/agents') as Promise<{ data: AdminAgentCatalogItem[] }>
}

export const fetchAdminAgentAccess = async () => {
  return get('admin/agent-access') as Promise<{ data: AdminAgentAccessRow[] }>
}

export const createAdminAgent = async (payload: { agent_id: string, display_name: string, button_label?: string | null, description?: string | null, is_active?: boolean }) => {
  return post('admin/agents', { body: payload }) as Promise<{ data: AdminAgentCatalogItem }>
}

export const syncAdminAgentsFromEnv = async () => {
  return post('admin/agents/sync', { body: {} }) as Promise<{ data: { env_agent_ids: string[], inserted_agent_ids: string[], existing_agent_ids: string[] } }>
}

export const setCustomerAgents = async (payload: { customer_id: string, agent_ids: string[], default_agent_id: string }) => {
  return put('admin/customer-agent-access', { body: payload }) as Promise<{ data: { customer_id: string, assigned_agent_ids: string[], default_agent_id: string } }>
}
