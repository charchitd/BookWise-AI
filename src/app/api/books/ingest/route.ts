import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { processBookIngestion } from '@/lib/ingest'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { bookId } = await req.json()
    if (!bookId) return NextResponse.json({ error: 'Missing bookId' }, { status: 400 })

    const result = await processBookIngestion(bookId, user.id)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
