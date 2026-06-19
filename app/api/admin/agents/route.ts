import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AuthError } from '@/app/api/utils/common'
import { createSupabaseAdminClient, requireMasterAdmin } from '@/app/api/admin/_utils'

const normalizeAgentId = (value: unknown) => {
  if (typeof value !== 'string') {
    throw new Error('Invalid payload: agent_id must be a string.')
  }
  const normalized = value.trim().toUpperCase()
  if (!normalized) {
    throw new Error('Invalid payload: agent_id is required.')
  }
  if (!/^[A-Z0-9_]+$/.test(normalized)) {
    throw new Error(`Invalid payload: agent_id must use uppercase letters, digits, and underscores only. received=${normalized}`)
  }
  return normalized
}

const normalizeDisplayName = (value: unknown) => {
  if (typeof value !== 'string') {
    throw new Error('Invalid payload: display_name must be a string.')
  }
  const normalized = value.trim()
  if (!normalized) {
    throw new Error('Invalid payload: display_name is required.')
  }
  if (normalized.length > 160) {
    throw new Error('Invalid payload: display_name exceeds max length 160.')
  }
  return normalized
}

const normalizeDescription = (value: unknown) => {
  if (typeof value === 'undefined' || value === null) {
    return null
  }
  if (typeof value !== 'string') {
    throw new Error('Invalid payload: description must be a string or null.')
  }
  const normalized = value.trim()
  if (!normalized) {
    return null
  }
  if (normalized.length > 500) {
    throw new Error('Invalid payload: description exceeds max length 500.')
  }
  return normalized
}

const normalizeButtonLabel = (value: unknown) => {
  if (typeof value === 'undefined' || value === null) {
    return null
  }
  if (typeof value !== 'string') {
    throw new Error('Invalid payload: button_label must be a string or null.')
  }
  const normalized = value.trim()
  if (!normalized) {
    return null
  }
  if (normalized.length > 40) {
    throw new Error('Invalid payload: button_label exceeds max length 40.')
  }
  return normalized
}

const normalizeActiveFlag = (value: unknown) => {
  if (typeof value === 'undefined') {
    return true
  }
  if (typeof value !== 'boolean') {
    throw new Error(`Invalid payload: is_active must be boolean. received=${String(value)}`)
  }
  return value
}

export async function GET(request: NextRequest) {
  try {
    await requireMasterAdmin(request)
    const serviceClient = createSupabaseAdminClient()
    const { data, error } = await serviceClient
      .from('agent_catalog')
      .select('agent_id,display_name,button_label,description,is_active')
      .order('agent_id', { ascending: true })

    if (error || !data) {
      throw new Error(`Failed to load agent catalog. reason=${error?.message || 'empty_result'}`)
    }
    return NextResponse.json({ data })
  }
  catch (error: any) {
    const status = error instanceof AuthError ? 401 : 500
    return NextResponse.json({
      error: error instanceof AuthError ? 'Unauthorized' : 'Admin agent catalog request failed',
      context: 'admin-agents',
      expected: error instanceof AuthError ? 'Authenticated master admin session' : 'Existing agent_catalog table with valid contract',
      received: error?.message || 'Unknown error',
    }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireMasterAdmin(request)
    const body = await request.json()
    const agentId = normalizeAgentId(body?.agent_id)
    const displayName = normalizeDisplayName(body?.display_name)
    const buttonLabel = normalizeButtonLabel(body?.button_label)
    const description = normalizeDescription(body?.description)
    const isActive = normalizeActiveFlag(body?.is_active)

    const serviceClient = createSupabaseAdminClient()
    const { data, error } = await serviceClient
      .from('agent_catalog')
      .upsert({
        agent_id: agentId,
        display_name: displayName,
        button_label: buttonLabel,
        description,
        is_active: isActive,
      }, { onConflict: 'agent_id' })
      .select('agent_id,display_name,button_label,description,is_active')
      .single()

    if (error || !data) {
      throw new Error(`Failed to save agent catalog row. agent_id=${agentId} reason=${error?.message || 'empty_result'}`)
    }
    return NextResponse.json({ data })
  }
  catch (error: any) {
    const status = error instanceof AuthError ? 401 : 400
    return NextResponse.json({
      error: error instanceof AuthError ? 'Unauthorized' : 'Admin agent catalog update failed',
      context: 'admin-agents-create',
      expected: error instanceof AuthError ? 'Authenticated master admin session' : 'Payload { agent_id: string, display_name: string, button_label?: string|null, description?: string|null, is_active?: boolean }',
      received: error?.message || 'Unknown error',
    }, { status })
  }
}
