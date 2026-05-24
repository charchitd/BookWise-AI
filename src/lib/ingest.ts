import { createAdminClient } from '@/lib/supabase'
import { extractText, segmentByDailyGoal } from '@/lib/pdf'
import { callOpenRouter } from '@/lib/openrouter'
import { buildIngestionPrompt } from '@/lib/prompts/book-ingestion'

export async function processBookIngestion(bookId: string, userId: string, dailyGoalMinutes = 60) {
  const supabase = createAdminClient()

  try {
    await supabase.from('books').update({ status: 'processing' }).eq('id', bookId)
    console.log(`INGEST START: bookId=${bookId} dailyGoal=${dailyGoalMinutes}min`)

    const storageUrl = `${userId}/${bookId}.pdf`
    const rawText = await extractText(storageUrl)

    // Strip null bytes and control chars that break Postgres text columns
    const text = rawText.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    console.log(`PDF TEXT: ${text.length} chars`)

    const segments = segmentByDailyGoal(text, dailyGoalMinutes)
    console.log(`SESSIONS PLANNED: ${segments.length} (${dailyGoalMinutes}min/day goal)`)

    // Delete any stale chapters from a previous failed attempt
    await supabase.from('chapters').delete().eq('book_id', bookId)

    const processSegment = async (seg: any) => {
      const { systemPrompt, userPrompt } = buildIngestionPrompt(
        seg.content,
        seg.num,
        seg.pageStart,
        seg.pageEnd,
        dailyGoalMinutes,
      )

      let title = seg.title
      let summary = ''
      let difficulty = 3
      let concepts: string[] = []
      let quizHints: string[] = []

      // Robust JSON Parsing with Retry
      let success = false;
      for (let attempt = 1; attempt <= 2 && !success; attempt++) {
        try {
          const raw = await callOpenRouter(systemPrompt, userPrompt, 'google/gemini-2.5-flash')
          const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
          const parsed = JSON.parse(cleaned)
          title = parsed.title || seg.title
          summary = parsed.summary || ''
          difficulty = parsed.difficulty || 3
          concepts = Array.isArray(parsed.concepts) ? parsed.concepts : []
          quizHints = Array.isArray(parsed.quiz_hints) ? parsed.quiz_hints : []
          console.log(`SESSION ${seg.num} AI ENRICHED (Attempt ${attempt}): "${title}" (${concepts.length} concepts)`)
          success = true;
        } catch (e) {
          console.warn(`SESSION ${seg.num} JSON parse failed on attempt ${attempt}:`, e)
          if (attempt === 2) console.error(`SESSION ${seg.num} AI totally failed, using defaults.`)
        }
      }

      // Smart Content Truncation (find last period before 50k limit)
      const MAX_LENGTH = 50000;
      let finalContent = seg.content;
      if (finalContent.length > MAX_LENGTH) {
        let cutoff = finalContent.lastIndexOf('.', MAX_LENGTH);
        if (cutoff === -1) cutoff = MAX_LENGTH;
        finalContent = finalContent.substring(0, cutoff + 1);
      }

      const { data: chapter, error: chErr } = await supabase
        .from('chapters')
        .insert({
          book_id: bookId,
          num: seg.num,
          title,
          summary,
          difficulty,
          page_start: seg.pageStart,
          page_end: seg.pageEnd,
          content: finalContent,
        })
        .select()
        .single()

      if (chErr || !chapter) {
        console.error(`Failed to insert session ${seg.num}:`, chErr)
        return seg.pageEnd
      }

      if (concepts.length > 0) {
        await supabase.from('concepts').insert(
          concepts.map((name: string) => ({
            chapter_id: chapter.id,
            book_id: bookId,
            name,
            mastery_state: 'new',
          }))
        )
      }

      if (quizHints.length > 0) {
        await supabase
          .from('chapters')
          .update({ quiz_hints: quizHints })
          .eq('id', chapter.id)
      }

      return seg.pageEnd
    }

    // Process in batches of 3 to avoid Vercel Serverless Timeouts while respecting API rate limits
    let maxPageEnd = 0;
    const BATCH_SIZE = 3;
    for (let i = 0; i < segments.length; i += BATCH_SIZE) {
      const batch = segments.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(batch.map(seg => processSegment(seg)));
      maxPageEnd = Math.max(maxPageEnd, ...results);
    }

    await supabase
      .from('books')
      .update({ status: 'ready', total_pages: maxPageEnd })
      .eq('id', bookId)

    console.log('INGEST COMPLETE')
    return { success: true, sessionCount: segments.length }
  } catch (error: any) {
    console.error('INGEST FAILED:', error.message)
    await supabase.from('books').update({ status: 'failed' }).eq('id', bookId)
    throw error
  }
}
