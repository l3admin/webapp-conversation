import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AuthError } from '@/app/api/utils/common'
import { createSupabaseAdminClient, requireMasterAdmin } from '@/app/api/admin/_utils'

const normalizeSlug = (value: unknown) => {
  if (typeof value !== 'string') {
    throw new Error('Invalid payload: slug must be a string.')
  }
  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    throw new Error('Invalid payload: slug is required.')
  }
  if (!/^[a-z0-9_]+$/.test(normalized)) {
    throw new Error(`Invalid payload: slug must use lowercase letters, digits, and underscores only. received=${normalized}`)
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

const normalizeStatus = (value: unknown) => {
  if (typeof value === 'undefined' || value === null) {
    return 'active'
  }
  if (typeof value !== 'string') {
    throw new Error('Invalid payload: status must be a string.')
  }
  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    return 'active'
  }
  return normalized
}

export async function GET(request: NextRequest) {
  try {
    await requireMasterAdmin(request)
    const serviceClient = createSupabaseAdminClient()
    const { data, error } = await serviceClient
      .from('customers')
      .select('id,slug,display_name,status')
      .order('created_at', { ascending: false })

    if (error || !data) {
      throw new Error(`Failed to load customers. reason=${error?.message || 'empty_result'}`)
    }
    return NextResponse.json({ data })
  }
  catch (error: any) {
    const status = error instanceof AuthError ? 401 : 500
    return NextResponse.json({
      error: error instanceof AuthError ? 'Unauthorized' : 'Admin customers request failed',
      context: 'admin-customers',
      expected: error instanceof AuthError ? 'Authenticated master admin session' : 'Existing customers table with valid contract',
      received: error?.message || 'Unknown error',
    }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireMasterAdmin(request)
    const body = await request.json()
    const slug = normalizeSlug(body?.slug)
    const displayName = normalizeDisplayName(body?.display_name)
    const status = normalizeStatus(body?.status)

    const serviceClient = createSupabaseAdminClient()
    const { data, error } = await serviceClient
      .from('customers')
      .insert({
        slug,
        display_name: displayName,
        status,
      })
      .select('id,slug,display_name,status')
      .single()

    if (error || !data) {
      throw new Error(`Failed to create customer. slug=${slug} reason=${error?.message || 'empty_result'}`)
    }

    return NextResponse.json({ data })
  }
  catch (error: any) {
    const status = error instanceof AuthError ? 401 : 400
    return NextResponse.json({
      error: error instanceof AuthError ? 'Unauthorized' : 'Admin customer create failed',
      context: 'admin-customers-create',
      expected: error instanceof AuthError ? 'Authenticated master admin session' : 'Payload { slug: string, display_name: string, status?: string }',
      received: error?.message || 'Unknown error',
    }, { status })
  }
}
