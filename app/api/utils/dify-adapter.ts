import { getClient } from '@/app/api/utils/common'

type ChatMessageBody = {
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

const isObject = (value: unknown): value is Record<string, any> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const assertChatMessageBody = (body: unknown): ChatMessageBody => {
  if (!isObject(body)) {
    throw new DifyContractError('Chat payload must be an object.')
  }
  if (!isObject(body.inputs)) {
    throw new DifyContractError('Chat payload contract mismatch: `inputs` must be an object.')
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
  },
  parseChatMessageBody(body: unknown) {
    return assertChatMessageBody(body)
  },
  async createChatMessageStream(body: ChatMessageBody, user: string) {
    const client = getClient()
    const res = await client.createChatMessage(
      body.inputs,
      body.query,
      user,
      body.response_mode,
      body.conversation_id,
      body.files,
    )
    return res.data as any
  },
  async getConversations(user: string) {
    const client = getClient()
    const { data }: any = await client.getConversations(user)
    return data
  },
  async getApplicationParameters(user: string) {
    const client = getClient()
    const { data } = await client.getApplicationParameters(user)
    return data
  },
  async getConversationMessages(user: string, conversationId: string) {
    const client = getClient()
    const { data }: any = await client.getConversationMessages(user, conversationId)
    return data
  },
  async messageFeedback(messageId: string, rating: any, user: string) {
    const client = getClient()
    const { data } = await client.messageFeedback(messageId, rating, user)
    return data
  },
  async renameConversation(conversationId: string, name: string, user: string, autoGenerate: boolean) {
    const client = getClient()
    const { data } = await client.renameConversation(conversationId, name, user, autoGenerate)
    return data
  },
  async fileUpload(formData: FormData) {
    const client = getClient()
    const res = await client.fileUpload(formData)
    return res.data.id as any
  },
}
