import type { NextRequest } from 'next/server'
import { AuthError, getInfo, resolveAgentId } from '@/app/api/utils/common'
import { difyAdapter } from '@/app/api/utils/dify-adapter'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsedBody = difyAdapter.parseChatMessageBody(body)
    const { user, authUserId } = await getInfo(request)
    const agentId = await resolveAgentId(request, authUserId, parsedBody.agent_id || null)
    const streamBody = await difyAdapter.createChatMessageStream(agentId, parsedBody, user)
    return new Response(streamBody)
  }
  catch (error: any) {
    const isContractError = error instanceof difyAdapter.errors.ContractError
    const isUpstreamError = error instanceof difyAdapter.errors.UpstreamError
    const status = error instanceof AuthError ? 401 : isContractError ? 400 : isUpstreamError ? (error.status || 502) : 500
    return Response.json({
      error: error instanceof AuthError ? 'Unauthorized' : isContractError ? 'Invalid chat payload contract' : 'Chat message request failed',
      context: 'chat-messages',
      expected: error instanceof AuthError
        ? 'Authenticated Supabase session cookie'
        : isContractError
            ? 'Payload { inputs: object, query: string, conversation_id: string|null, response_mode: string, files?: array }'
            : 'Valid Dify request payload and available upstream API',
      received: error?.message || 'Unknown error',
      upstreamStatus: isUpstreamError ? error.status : undefined,
      upstreamCode: isUpstreamError ? error.upstreamCode : undefined,
      upstreamOperation: isUpstreamError ? error.operation : undefined,
      upstreamPayload: isUpstreamError ? error.upstreamPayload : undefined,
      message: error?.message || 'Unknown error',
    }, { status })
  }
}
