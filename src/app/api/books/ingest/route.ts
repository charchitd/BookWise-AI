import { NextResponse } from 'next/server'
import { processBookIngestion } from '@/lib/ingest'

export const maxDuration = 300 // allow up to 5 minutes for book ingestion serverless execution

export async function POST(req: Request) {
  try {
    const { bookId, userId } = await req.json()
    if (!bookId || !userId) return NextResponse.json({ error: 'Missing bookId or userId' }, { status: 400 })

    const result = await processBookIngestion(bookId, userId)
    return NextResponse.json(result)

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
