import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { AuthError, client, getInfo } from '@/app/api/utils/common'

export async function GET(request: NextRequest) {
  try {
    const { user } = await getInfo(request)
    const { data } = await client.getApplicationParameters(user)
    return NextResponse.json(data as object)
  }
  catch (error: any) {
    const status = error instanceof AuthError ? 401 : 500
    return NextResponse.json({
      error: error instanceof AuthError ? 'Unauthorized' : 'Parameters request failed',
      context: 'parameters',
      expected: error instanceof AuthError ? 'Authenticated Supabase session cookie' : 'Valid Dify upstream response',
      received: error?.message || 'Unknown error',
    }, { status })
  }
}
