import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AuthError } from '@/app/api/utils/common'
import { createSupabaseAdminClient, requireMasterAdmin } from '@/app/api/admin/_utils'
import { formatAgentDisplayNameFromId, listConfiguredDifyAgentIds } from '@/config/server'

export async function POST(request: NextRequest) {
  try {
    await requireMasterAdmin(request)
    const serviceClient = createSupabaseAdminClient()

    const envAgentIds = listConfiguredDifyAgentIds()
    if (!envAgentIds.length) {
      throw new Error('No Dify agent API keys found in env. Expected at least one DIFY_APP_API_KEY_<AGENT_ID> variable.')
    }

    const { data: existingRows, error: existingError } = await serviceClient
      .from('agent_catalog')
      .select('agent_id')
      .in('agent_id', envAgentIds)

    if (existingError) {
      throw new Error(`Failed to read existing agent catalog rows. reason=${existingError.message}`)
    }

    const existingAgentIds = new Set((existingRows || []).map(row => row.agent_id))
    const missingAgentIds = envAgentIds.filter(agentId => !existingAgentIds.has(agentId))

    if (missingAgentIds.length) {
      const { error: insertError } = await serviceClient
        .from('agent_catalog')
        .insert(missingAgentIds.map(agentId => ({
          agent_id: agentId,
          display_name: formatAgentDisplayNameFromId(agentId),
          button_label: formatAgentDisplayNameFromId(agentId),
          description: null,
          is_active: true,
        })))

      if (insertError) {
        throw new Error(`Failed to insert missing agent catalog rows. reason=${insertError.message}`)
      }
    }

    return NextResponse.json({
      data: {
        env_agent_ids: envAgentIds,
        inserted_agent_ids: missingAgentIds,
        existing_agent_ids: envAgentIds.filter(agentId => existingAgentIds.has(agentId)),
      },
    })
  }
  catch (error: any) {
    const status = error instanceof AuthError ? 401 : 400
    return NextResponse.json({
      error: error instanceof AuthError ? 'Unauthorized' : 'Admin agent sync failed',
      context: 'admin-agents-sync',
      expected: error instanceof AuthError ? 'Authenticated master admin session' : 'At least one DIFY_APP_API_KEY_<AGENT_ID> env variable and writable agent_catalog table',
      received: error?.message || 'Unknown error',
    }, { status })
  }
}
