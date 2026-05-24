if (typeof process !== 'undefined') {
  if (typeof (global as any).DOMMatrix === 'undefined') {
    (global as any).DOMMatrix = class DOMMatrix {}
  }
  if (typeof (global as any).Path2D === 'undefined') {
    (global as any).Path2D = class Path2D {}
  }
}

import { createAdminClient } from './supabase'

export async function extractText(storageUrl: string): Promise<string> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.storage.from('books').download(storageUrl)
  if (error || !data) throw new Error('Failed to download PDF from storage')

  const arrayBuffer = await data.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const pdfParse = (await import('pdf-parse')).default || await import('pdf-parse')

  function render_page(pageData: any) {
    return pageData.getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false })
      .then((textContent: any) => {
        let lastY: number | undefined
        let text = ''
        for (const item of textContent.items) {
          if (lastY === item.transform[5] || !lastY) {
            text += item.str
          } else {
            text += '\n' + item.str
          }
          lastY = item.transform[5]
        }
        return `\n[PAGE_${pageData.pageIndex + 1}]\n` + text
      })
  }

  const pdfParseFn = typeof pdfParse === 'function' ? pdfParse : (pdfParse as any).default
  const result = await pdfParseFn(buffer, { pagerender: render_page })
  console.log('RAW TEXT SAMPLE:', result.text.substring(0, 500))
  return result.text
}

export interface PageSegment {
  num: number
  title: string
  pageStart: number
  pageEnd: number
  content: string
  estimatedMinutes: number
}

/**
 * Splits PDF text into learning sessions sized to the user's daily goal.
 * Uses [PAGE_N] markers embedded during extraction.
 * Each session targets ~half the daily goal so users can do 2 sessions/day.
 */
export function segmentByDailyGoal(text: string, dailyGoalMinutes: number): PageSegment[] {
  // Split by page markers, keep page numbers
  const pageRegex = /\[PAGE_(\d+)\]([\s\S]*?)(?=\[PAGE_\d+\]|$)/g
  const pages: { num: number; content: string }[] = []
  let match: RegExpExecArray | null

  while ((match = pageRegex.exec(text)) !== null) {
    const content = match[2].trim()
    if (content.length > 50) {
      pages.push({ num: parseInt(match[1]), content })
    }
  }

  if (pages.length === 0) {
    // Fallback: no page markers, treat as one session
    return [{
      num: 1,
      title: 'Full Document',
      pageStart: 1,
      pageEnd: 1,
      content: text.trim(),
      estimatedMinutes: dailyGoalMinutes,
    }]
  }

  // Target pages per session: 2 min/page, session = half daily goal, clamped 8–35 pages
  const MINS_PER_PAGE = 2
  const sessionTargetMins = Math.max(15, Math.min(45, Math.floor(dailyGoalMinutes / 2)))
  const pagesPerSession = Math.max(8, Math.min(35, Math.round(sessionTargetMins / MINS_PER_PAGE)))

  const segments: PageSegment[] = []
  for (let i = 0; i < pages.length; i += pagesPerSession) {
    const chunk = pages.slice(i, i + pagesPerSession)
    segments.push({
      num: segments.length + 1,
      title: `Session ${segments.length + 1}`,   // placeholder — AI will rename
      pageStart: chunk[0].num,
      pageEnd: chunk[chunk.length - 1].num,
      content: chunk.map(p => p.content).join('\n\n'),
      estimatedMinutes: chunk.length * MINS_PER_PAGE,
    })
  }

  return segments
}
