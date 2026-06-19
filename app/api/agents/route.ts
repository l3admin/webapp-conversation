import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AuthError, getAvailableAgents, getInfo } from '@/app/api/utils/common'
import { DIFY_API_BASE_URL } from '@/config/server'

export async function GET(request: NextRequest) {
  try {
    const info = await getInfo(request)
    const { agents, defaultAgentId } = await getAvailableAgents(request, info.authUserId)
    return NextResponse.json({
      data: agents,
      default_agent_id: defaultAgentId,
      viewer: info.viewer,
      admin_debug: info.viewer.is_master_admin
        ? {
            dify_base_url: DIFY_API_BASE_URL || '',
          }
        : null,
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
