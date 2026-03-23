import { createAdminClient } from '@/lib/supabase'
import { extractText, segmentChapters } from '@/lib/pdf'
import { callGemini } from '@/lib/gemini'
import { buildIngestionPrompt } from '@/lib/prompts/book-ingestion'

export async function processBookIngestion(bookId: string, userId: string) {
  const supabase = createAdminClient()
  
  try {
    // 1. Ensure status is processing at start
    await supabase.from('books').update({ status: 'processing' }).eq('id', bookId)

    const storageUrl = `${userId}/${bookId}.pdf`
    const text = await extractText(storageUrl)
    const chapters = segmentChapters(text)

    for (const ch of chapters) {
      const { data: chapterData, error: chError } = await supabase.from('chapters')
        .insert({
          book_id: bookId,
          num: ch.num,
          title: ch.title,
          page_start: ch.pageStart,
          page_end: ch.pageEnd,
          content: ch.content
        }).select().single()
      
      if (chError || !chapterData) {
        console.error("Failed to insert chapter:", ch.title, chError)
        continue
      }

      const { systemPrompt, userPrompt } = buildIngestionPrompt(ch.content, ch.num, ch.title)
      
      try {
        const jsonResponse = await callGemini(systemPrompt, userPrompt, 1500)
        let cleanJson = jsonResponse.trim()
        if (cleanJson.startsWith('```json')) cleanJson = cleanJson.replace(/```json/g, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(cleanJson)

        await supabase.from('chapters').update({
          summary: parsed.summary,
          difficulty: parsed.difficulty
        }).eq('id', chapterData.id)

        if (parsed.concepts && Array.isArray(parsed.concepts)) {
          const conceptsToInsert = parsed.concepts.map((c: string) => ({
            chapter_id: chapterData.id,
            book_id: bookId,
            name: c,
            mastery_state: 'new',
          }))
          await supabase.from('concepts').insert(conceptsToInsert)
        }
      } catch (e) {
        console.error('Gemini API or JSON parsing error for chapter', ch.num, e)
      }
    }

    await supabase.from('books').update({ 
      status: 'ready',
      total_pages: chapters[chapters.length - 1]?.pageEnd || 0
    }).eq('id', bookId)

    return { success: true, chapterCount: chapters.length }
  } catch (error: any) {
    console.error("Ingestion explicitly failed for bookId", bookId, "Error:", error)
    await supabase.from('books').update({ status: 'failed' }).eq('id', bookId)
    throw error
  }
}
