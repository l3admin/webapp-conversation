import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { AuthError, getInfo, resolveAgentId } from '@/app/api/utils/common'
import { difyAdapter } from '@/app/api/utils/dify-adapter'

export async function POST(request: NextRequest, { params }: {
  params: Promise<{ conversationId: string }>
}) {
  try {
    const body = await request.json()
    const {
      auto_generate,
      name,
    } = body
    const { conversationId } = await params
    const { user } = await getInfo(request)
    const agentId = resolveAgentId(request, body?.agent_id || null)

    // auto generate name
    const data = await difyAdapter.renameConversation(agentId, conversationId, name, user, auto_generate)
    return NextResponse.json(data)
  }
  catch (error: any) {
    const isUpstreamError = error instanceof difyAdapter.errors.UpstreamError
    const status = error instanceof AuthError ? 401 : isUpstreamError ? (error.status || 502) : 500
    return NextResponse.json({
      error: error instanceof AuthError ? 'Unauthorized' : 'Rename conversation request failed',
      context: 'conversation-name',
      expected: error instanceof AuthError ? 'Authenticated Supabase session cookie' : 'Valid conversation rename payload and upstream response',
      received: error?.message || 'Unknown error',
      upstreamStatus: isUpstreamError ? error.status : undefined,
      upstreamCode: isUpstreamError ? error.upstreamCode : undefined,
      upstreamOperation: isUpstreamError ? error.operation : undefined,
      upstreamPayload: isUpstreamError ? error.upstreamPayload : undefined,
      message: error?.message || 'Unknown error',
    }, { status })
  }
}
