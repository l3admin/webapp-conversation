import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { AuthError, getInfo } from '@/app/api/utils/common'
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

    // auto generate name
    const data = await difyAdapter.renameConversation(conversationId, name, user, auto_generate)
    return NextResponse.json(data)
  }
  catch (error: any) {
    const status = error instanceof AuthError ? 401 : 500
    return NextResponse.json({
      error: error instanceof AuthError ? 'Unauthorized' : 'Rename conversation request failed',
      context: 'conversation-name',
      expected: error instanceof AuthError ? 'Authenticated Supabase session cookie' : 'Valid conversation rename payload and upstream response',
      received: error?.message || 'Unknown error',
    }, { status })
  }
}
