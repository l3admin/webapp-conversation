import type { IOnCompleted, IOnData, IOnError, IOnFile, IOnMessageEnd, IOnMessageReplace, IOnNodeFinished, IOnNodeStarted, IOnThought, IOnWorkflowFinished, IOnWorkflowStarted } from './base'
import { get, post, ssePost } from './base'
import type { AgentItem, Feedbacktype } from '@/types/app'

export const fetchAgents = async () => {
  return get('agents') as Promise<{ data: AgentItem[], default_agent_id: string }>
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
