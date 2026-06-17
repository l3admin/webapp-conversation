import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { AuthError, getInfo } from '@/app/api/utils/common'
import { difyAdapter } from '@/app/api/utils/dify-adapter'

export async function GET(request: NextRequest) {
  try {
    const { user } = await getInfo(request)
    const data = await difyAdapter.getConversations(user)
    return NextResponse.json(data)
  }
  catch (error: any) {
    const status = error instanceof AuthError ? 401 : 500
    return NextResponse.json({
      error: error instanceof AuthError ? 'Unauthorized' : 'Conversation request failed',
      context: 'conversations',
      expected: error instanceof AuthError ? 'Authenticated Supabase session cookie' : 'Valid Dify upstream response',
      received: error?.message || 'Unknown error',
    }, { status })
  }
}
