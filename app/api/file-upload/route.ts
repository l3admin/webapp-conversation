import type { NextRequest } from 'next/server'
import { AuthError, getInfo } from '@/app/api/utils/common'
import { difyAdapter } from '@/app/api/utils/dify-adapter'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const { user } = await getInfo(request)
    formData.append('user', user)
    const fileId = await difyAdapter.fileUpload(formData)
    return new Response(fileId)
  }
  catch (e: any) {
    const status = e instanceof AuthError ? 401 : 500
    return Response.json({
      error: e instanceof AuthError ? 'Unauthorized' : 'File upload request failed',
      context: 'file-upload',
      expected: e instanceof AuthError ? 'Authenticated Supabase session cookie' : 'Valid file payload and upstream response',
      received: e?.message || 'Unknown error',
    }, { status })
  }
}
