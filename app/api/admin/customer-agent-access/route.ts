import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AuthError } from '@/app/api/utils/common'
import { createSupabaseAdminClient, requireMasterAdmin } from '@/app/api/admin/_utils'
import { formatAgentDisplayNameFromId, hasDifyApiKeyForAgentId } from '@/config/server'

const requireString = (value: unknown, field: string) => {
  if (typeof value !== 'string') {
    throw new Error(`Invalid payload: '${field}' must be a string.`)
  }
  const normalized = value.trim()
  if (!normalized) {
    throw new Error(`Invalid payload: '${field}' is required.`)
  }
  return normalized
}

const normalizeAgentIds = (value: unknown) => {
  if (!Array.isArray(value) || !value.length) {
    throw new Error('Invalid payload: agent_ids must be a non-empty array.')
  }
  const normalized = value.map((item) => {
    if (typeof item !== 'string' || !item.trim()) {
      throw new Error(`Invalid payload: all agent_ids must be non-empty strings. received=${String(item)}`)
    }
    return item.trim().toUpperCase()
  })
  return Array.from(new Set(normalized))
}

export async function PUT(request: NextRequest) {
  try {
    await requireMasterAdmin(request)
    const body = await request.json()
    const customerId = requireString(body?.customer_id, 'customer_id')
    const agentIds = normalizeAgentIds(body?.agent_ids)
    const defaultAgentId = requireString(body?.default_agent_id, 'default_agent_id').toUpperCase()

    if (!agentIds.includes(defaultAgentId)) {
      throw new Error(`Invalid payload: default_agent_id must exist in agent_ids. default_agent_id=${defaultAgentId}`)
    }

    const serviceClient = createSupabaseAdminClient()
    const { data: initialCatalogRows, error: catalogError } = await serviceClient
      .from('agent_catalog')
      .select('agent_id,is_active')
      .in('agent_id', agentIds)

    if (catalogError) {
      throw new Error(`Failed to validate agent catalog rows. reason=${catalogError.message}`)
    }

    const initialCatalogById = new Map((initialCatalogRows || []).map(row => [row.agent_id, row]))
    const missingCatalogAgentIds = agentIds.filter(agentId => !initialCatalogById.has(agentId))

    if (missingCatalogAgentIds.length) {
      const missingEnvKeys = missingCatalogAgentIds.filter(agentId => !hasDifyApiKeyForAgentId(agentId))
      if (missingEnvKeys.length) {
        throw new Error(`Missing agent_catalog rows and missing DIFY env keys for some agent_ids. agent_ids=${missingEnvKeys.join(',')}`)
      }

      const { error: upsertError } = await serviceClient
        .from('agent_catalog')
        .upsert(missingCatalogAgentIds.map(agentId => ({
          agent_id: agentId,
          display_name: formatAgentDisplayNameFromId(agentId),
          button_label: formatAgentDisplayNameFromId(agentId),
          description: null,
          is_active: true,
        })), { onConflict: 'agent_id' })

      if (upsertError) {
        throw new Error(`Failed to auto-provision missing agent_catalog rows from env-backed agent_ids. reason=${upsertError.message}`)
      }
    }

    const { data: catalogRows, error: refreshedCatalogError } = await serviceClient
      .from('agent_catalog')
      .select('agent_id,is_active')
      .in('agent_id', agentIds)

    if (refreshedCatalogError) {
      throw new Error(`Failed to re-validate agent catalog rows after provisioning. reason=${refreshedCatalogError.message}`)
    }
    if (!catalogRows?.length || catalogRows.length !== agentIds.length) {
      throw new Error(`Missing agent_catalog rows for some agent_ids after provisioning. requested=${agentIds.join(',')}`)
    }

    const inactiveRows = catalogRows.filter(row => !row.is_active)
    if (inactiveRows.length) {
      throw new Error(`Cannot assign inactive agents. agent_ids=${inactiveRows.map(row => row.agent_id).join(',')}`)
    }

    const { error: deleteError } = await serviceClient
      .from('customer_agent_access')
      .delete()
      .eq('customer_id', customerId)

    if (deleteError) {
      throw new Error(`Failed to clear existing customer agent assignments. customer_id=${customerId} reason=${deleteError.message}`)
    }

    const rowsToInsert = agentIds.map(agentId => ({
      customer_id: customerId,
      agent_id: agentId,
      is_default: agentId === defaultAgentId,
    }))
    const { error: insertError } = await serviceClient
      .from('customer_agent_access')
      .insert(rowsToInsert)

    if (insertError) {
      throw new Error(`Failed to save customer agent assignments. customer_id=${customerId} reason=${insertError.message}`)
    }

    return NextResponse.json({
      data: {
        customer_id: customerId,
        assigned_agent_ids: agentIds,
        default_agent_id: defaultAgentId,
        auto_provisioned_catalog_agent_ids: missingCatalogAgentIds,
      },
    })
  }
  catch (error: any) {
    const status = error instanceof AuthError ? 401 : 400
    return NextResponse.json({
      error: error instanceof AuthError ? 'Unauthorized' : 'Admin customer-agent assignment failed',
      context: 'admin-customer-agent-access',
      expected: error instanceof AuthError ? 'Authenticated master admin session' : 'Payload { customer_id: string, agent_ids: string[], default_agent_id: string }',
      received: error?.message || 'Unknown error',
    }, { status })
  }
}
