import type { NextRequest } from 'next/server'
import { AuthError, client, getInfo } from '@/app/api/utils/common'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      inputs,
      query,
      files,
      conversation_id: conversationId,
      response_mode: responseMode,
    } = body
    const { user } = await getInfo(request)
    const res = await client.createChatMessage(inputs, query, user, responseMode, conversationId, files)
    return new Response(res.data as any)
  }
  catch (error: any) {
    const status = error instanceof AuthError ? 401 : 500
    return Response.json({
      error: error instanceof AuthError ? 'Unauthorized' : 'Chat message request failed',
      context: 'chat-messages',
      expected: error instanceof AuthError ? 'Authenticated Supabase session cookie' : 'Valid Dify request payload and available upstream API',
      received: error?.message || 'Unknown error',
    }, { status })
  }
}
