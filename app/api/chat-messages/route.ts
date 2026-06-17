import type { NextRequest } from 'next/server'
import { AuthError, getInfo } from '@/app/api/utils/common'
import { difyAdapter } from '@/app/api/utils/dify-adapter'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsedBody = difyAdapter.parseChatMessageBody(body)
    const { user } = await getInfo(request)
    const streamBody = await difyAdapter.createChatMessageStream(parsedBody, user)
    return new Response(streamBody)
  }
  catch (error: any) {
    const isContractError = error instanceof difyAdapter.errors.ContractError
    const status = error instanceof AuthError ? 401 : isContractError ? 400 : 500
    return Response.json({
      error: error instanceof AuthError ? 'Unauthorized' : isContractError ? 'Invalid chat payload contract' : 'Chat message request failed',
      context: 'chat-messages',
      expected: error instanceof AuthError
        ? 'Authenticated Supabase session cookie'
        : isContractError
            ? 'Payload { inputs: object, query: string, conversation_id: string|null, response_mode: string, files?: array }'
            : 'Valid Dify request payload and available upstream API',
      received: error?.message || 'Unknown error',
    }, { status })
  }
}
