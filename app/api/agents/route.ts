import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AuthError, getAvailableAgents, getDefaultAgentId, getInfo } from '@/app/api/utils/common'

export async function GET(request: NextRequest) {
  try {
    await getInfo(request)
    const agents = getAvailableAgents()
    return NextResponse.json({
      data: agents,
      default_agent_id: getDefaultAgentId(),
    })
  }
  catch (error: any) {
    const status = error instanceof AuthError ? 401 : 500
    return NextResponse.json({
      error: error instanceof AuthError ? 'Unauthorized' : 'Agents request failed',
      context: 'agents',
      expected: error instanceof AuthError ? 'Authenticated Supabase session cookie' : 'Valid server-side agent registry configuration',
      received: error?.message || 'Unknown error',
    }, { status })
  }
}
