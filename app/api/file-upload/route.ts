import type { NextRequest } from 'next/server'
import { AuthError, getInfo, resolveAgentId } from '@/app/api/utils/common'
import { difyAdapter } from '@/app/api/utils/dify-adapter'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const { user, authUserId } = await getInfo(request)
    const bodyAgentId = typeof formData.get('agent_id') === 'string' ? String(formData.get('agent_id')) : null
    const agentId = await resolveAgentId(request, authUserId, bodyAgentId)
    formData.append('user', user)
    const fileId = await difyAdapter.fileUpload(agentId, formData)
    return new Response(fileId)
  }
  catch (e: any) {
    const isUpstreamError = e instanceof difyAdapter.errors.UpstreamError
    const status = e instanceof AuthError ? 401 : isUpstreamError ? (e.status || 502) : 500
    return Response.json({
      error: e instanceof AuthError ? 'Unauthorized' : 'File upload request failed',
      context: 'file-upload',
      expected: e instanceof AuthError ? 'Authenticated Supabase session cookie' : 'Valid file payload and upstream response',
      received: e?.message || 'Unknown error',
      upstreamStatus: isUpstreamError ? e.status : undefined,
      upstreamCode: isUpstreamError ? e.upstreamCode : undefined,
      upstreamOperation: isUpstreamError ? e.operation : undefined,
      upstreamPayload: isUpstreamError ? e.upstreamPayload : undefined,
      message: e?.message || 'Unknown error',
    }, { status })
  }
}
