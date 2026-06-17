import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { AuthError, getInfo } from '@/app/api/utils/common'
import { difyAdapter } from '@/app/api/utils/dify-adapter'

export async function GET(request: NextRequest) {
  try {
    const { user } = await getInfo(request)
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversation_id')
    const data = await difyAdapter.getConversationMessages(user, conversationId as string)
    return NextResponse.json(data)
  }
  catch (error: any) {
    const status = error instanceof AuthError ? 401 : 500
    return NextResponse.json({
      error: error instanceof AuthError ? 'Unauthorized' : 'Messages request failed',
      context: 'messages',
      expected: error instanceof AuthError ? 'Authenticated Supabase session cookie' : 'Valid Dify upstream response',
      received: error?.message || 'Unknown error',
    }, { status })
  }
}
