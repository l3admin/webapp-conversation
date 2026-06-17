import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { AuthError, getInfo } from '@/app/api/utils/common'
import { difyAdapter } from '@/app/api/utils/dify-adapter'

export async function POST(request: NextRequest, { params }: {
  params: Promise<{ messageId: string }>
}) {
  try {
    const body = await request.json()
    const {
      rating,
    } = body
    const { messageId } = await params
    const { user } = await getInfo(request)
    const data = await difyAdapter.messageFeedback(messageId, rating, user)
    return NextResponse.json(data)
  }
  catch (error: any) {
    const isUpstreamError = error instanceof difyAdapter.errors.UpstreamError
    const status = error instanceof AuthError ? 401 : isUpstreamError ? (error.status || 502) : 500
    return NextResponse.json({
      error: error instanceof AuthError ? 'Unauthorized' : 'Feedback request failed',
      context: 'message-feedback',
      expected: error instanceof AuthError ? 'Authenticated Supabase session cookie' : 'Valid feedback payload and upstream response',
      received: error?.message || 'Unknown error',
      upstreamStatus: isUpstreamError ? error.status : undefined,
      upstreamCode: isUpstreamError ? error.upstreamCode : undefined,
      upstreamOperation: isUpstreamError ? error.operation : undefined,
      upstreamPayload: isUpstreamError ? error.upstreamPayload : undefined,
      message: error?.message || 'Unknown error',
    }, { status })
  }
}
