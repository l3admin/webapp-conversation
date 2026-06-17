import { getClient } from '@/app/api/utils/common'

type ChatMessageBody = {
  agent_id?: string
  inputs: Record<string, any>
  query: string
  files?: any[]
  conversation_id: string | null
  response_mode: string
}

class DifyContractError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DifyContractError'
  }
}

class DifyUpstreamError extends Error {
  status?: number
  upstreamCode?: string
  upstreamPayload?: unknown
  operation: string

  constructor({
    message,
    operation,
    status,
    upstreamCode,
    upstreamPayload,
  }: {
    message: string
    operation: string
    status?: number
    upstreamCode?: string
    upstreamPayload?: unknown
  }) {
    super(message)
    this.name = 'DifyUpstreamError'
    this.operation = operation
    this.status = status
    this.upstreamCode = upstreamCode
    this.upstreamPayload = upstreamPayload
  }
}

const isObject = (value: unknown): value is Record<string, any> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const normalizeUpstreamError = (error: any, operation: string): DifyUpstreamError => {
  const status = typeof error?.response?.status === 'number' ? error.response.status : undefined
  const payload = error?.response?.data
  const upstreamCode = typeof payload?.code === 'string' ? payload.code : undefined
  const upstreamMessage = typeof payload?.message === 'string' ? payload.message : undefined
  const message = upstreamMessage || error?.message || `Dify request failed during ${operation}`

  return new DifyUpstreamError({
    message,
    operation,
    status,
    upstreamCode,
    upstreamPayload: payload,
  })
}

const withDifyErrorHandling = async <T>(operation: string, fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn()
  }
  catch (error: any) {
    throw normalizeUpstreamError(error, operation)
  }
}

const assertChatMessageBody = (body: unknown): ChatMessageBody => {
  if (!isObject(body)) {
    throw new DifyContractError('Chat payload must be an object.')
  }
  if (!isObject(body.inputs)) {
    throw new DifyContractError('Chat payload contract mismatch: `inputs` must be an object.')
  }
  if (body.agent_id !== undefined && typeof body.agent_id !== 'string') {
    throw new DifyContractError('Chat payload contract mismatch: `agent_id` must be a string when provided.')
  }
  if (typeof body.query !== 'string') {
    throw new DifyContractError('Chat payload contract mismatch: `query` must be a string.')
  }
  if (body.conversation_id !== null && typeof body.conversation_id !== 'string') {
    throw new DifyContractError('Chat payload contract mismatch: `conversation_id` must be a string or null.')
  }
  if (typeof body.response_mode !== 'string') {
    throw new DifyContractError('Chat payload contract mismatch: `response_mode` must be a string.')
  }
  if (body.files !== undefined && !Array.isArray(body.files)) {
    throw new DifyContractError('Chat payload contract mismatch: `files` must be an array when provided.')
  }

  return body as ChatMessageBody
}

export const difyAdapter = {
  errors: {
    ContractError: DifyContractError,
    UpstreamError: DifyUpstreamError,
  },
  parseChatMessageBody(body: unknown) {
    return assertChatMessageBody(body)
  },
  async createChatMessageStream(agentId: string, body: ChatMessageBody, user: string) {
    return withDifyErrorHandling('createChatMessageStream', async () => {
      const client = getClient(agentId)
      const res = await client.createChatMessage(
        body.inputs,
        body.query,
        user,
        body.response_mode,
        body.conversation_id,
        body.files,
      )
      return res.data as any
    })
  },
  async getConversations(agentId: string, user: string) {
    return withDifyErrorHandling('getConversations', async () => {
      const client = getClient(agentId)
      const { data }: any = await client.getConversations(user)
      return data
    })
  },
  async getApplicationParameters(agentId: string, user: string) {
    return withDifyErrorHandling('getApplicationParameters', async () => {
      const client = getClient(agentId)
      const { data } = await client.getApplicationParameters(user)
      return data
    })
  },
  async getConversationMessages(agentId: string, user: string, conversationId: string) {
    return withDifyErrorHandling('getConversationMessages', async () => {
      const client = getClient(agentId)
      const { data }: any = await client.getConversationMessages(user, conversationId)
      return data
    })
  },
  async messageFeedback(agentId: string, messageId: string, rating: any, user: string) {
    return withDifyErrorHandling('messageFeedback', async () => {
      const client = getClient(agentId)
      const { data } = await client.messageFeedback(messageId, rating, user)
      return data
    })
  },
  async renameConversation(agentId: string, conversationId: string, name: string, user: string, autoGenerate: boolean) {
    return withDifyErrorHandling('renameConversation', async () => {
      const client = getClient(agentId)
      const { data } = await client.renameConversation(conversationId, name, user, autoGenerate)
      return data
    })
  },
  async fileUpload(agentId: string, formData: FormData) {
    return withDifyErrorHandling('fileUpload', async () => {
      const client = getClient(agentId)
      const res = await client.fileUpload(formData)
      return res.data.id as any
    })
  },
}
