import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase'

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const bookId = searchParams.get('id')
    if (!bookId) return NextResponse.json({ error: 'Missing bookId' }, { status: 400 })

    const supabaseUser = await createServerClient()
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminClient()
    const { data: book } = await adminClient.from('books').select('*').eq('id', bookId).single()
    
    if (!book || book.user_id !== user.id) {
       return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // 1. Delete storage item
    const storagePath = `${user.id}/${bookId}.pdf`
    await adminClient.storage.from('books').remove([storagePath])

    // 2. Delete db record (chapters & concepts cascade automatically)
    await adminClient.from('books').delete().eq('id', bookId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete failed:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
