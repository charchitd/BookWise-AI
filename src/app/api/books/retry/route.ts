import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase'
import { processBookIngestion } from '@/lib/ingest'

export const maxDuration = 300

export async function POST(req: Request) {
  try {
    const { bookId } = await req.json()
    if (!bookId) return NextResponse.json({ error: 'Missing bookId' }, { status: 400 })

    // Verify ownership using the session cookie client
    const supabaseUser = await createServerClient()
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminClient()
    const { data: book } = await adminClient.from('books').select('*').eq('id', bookId).single()
    if (!book || book.user_id !== user.id) {
       return NextResponse.json({ error: 'Book not found or unauthorized' }, { status: 404 })
    }

    // Cleanslate existing extraction data
    await adminClient.from('books').update({ status: 'processing' }).eq('id', bookId)
    await adminClient.from('concepts').delete().eq('book_id', bookId)
    await adminClient.from('chapters').delete().eq('book_id', bookId)

    // Run ingestion
    const result = await processBookIngestion(bookId, user.id)
    return NextResponse.json(result)

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
