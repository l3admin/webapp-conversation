import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { AuthError, getClient, getInfo } from '@/app/api/utils/common'

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
    const client = getClient()
    const { data } = await client.messageFeedback(messageId, rating, user)
    return NextResponse.json(data)
  }
  catch (error: any) {
    const status = error instanceof AuthError ? 401 : 500
    return NextResponse.json({
      error: error instanceof AuthError ? 'Unauthorized' : 'Feedback request failed',
      context: 'message-feedback',
      expected: error instanceof AuthError ? 'Authenticated Supabase session cookie' : 'Valid feedback payload and upstream response',
      received: error?.message || 'Unknown error',
    }, { status })
  }
}
