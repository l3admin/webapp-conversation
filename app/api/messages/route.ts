import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { AuthError, getInfo, resolveAgentId } from '@/app/api/utils/common'
import { difyAdapter } from '@/app/api/utils/dify-adapter'

export async function GET(request: NextRequest) {
  try {
    const { user } = await getInfo(request)
    const agentId = resolveAgentId(request)
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversation_id')
    const data = await difyAdapter.getConversationMessages(agentId, user, conversationId as string)
    return NextResponse.json(data)
  }
  catch (error: any) {
    const isUpstreamError = error instanceof difyAdapter.errors.UpstreamError
    const status = error instanceof AuthError ? 401 : isUpstreamError ? (error.status || 502) : 500
    return NextResponse.json({
      error: error instanceof AuthError ? 'Unauthorized' : 'Messages request failed',
      context: 'messages',
      expected: error instanceof AuthError ? 'Authenticated Supabase session cookie' : 'Valid Dify upstream response',
      received: error?.message || 'Unknown error',
      upstreamStatus: isUpstreamError ? error.status : undefined,
      upstreamCode: isUpstreamError ? error.upstreamCode : undefined,
      upstreamOperation: isUpstreamError ? error.operation : undefined,
      upstreamPayload: isUpstreamError ? error.upstreamPayload : undefined,
      message: error?.message || 'Unknown error',
    }, { status })
  }
}
