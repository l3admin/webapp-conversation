import type { NextRequest } from 'next/server'
import { AuthError, client, getInfo } from '@/app/api/utils/common'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const { user } = await getInfo(request)
    formData.append('user', user)
    const res = await client.fileUpload(formData)
    return new Response(res.data.id as any)
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
