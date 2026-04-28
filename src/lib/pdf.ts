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

  // pdf-parse uses a function API
  const pdfParse = (await import('pdf-parse')).default || await import('pdf-parse');
  
  function render_page(pageData: any) {
    let render_options = {
        normalizeWhitespace: false,
        disableCombineTextItems: false
    }

    return pageData.getTextContent(render_options)
    .then(function(textContent: any) {
        let lastY, text = '';
        for (let item of textContent.items) {
            if (lastY == item.transform[5] || !lastY){
                text += item.str;
            }  
            else{
                text += '\n' + item.str;
            }    
            lastY = item.transform[5];
        }
        return `\n[PAGE_${pageData.pageIndex + 1}]\n` + text;
    });
  }

  const options = {
      pagerender: render_page
  }

  const pdfParseFn = typeof pdfParse === 'function' ? pdfParse : (pdfParse as any).default;
  const result = await pdfParseFn(buffer, options);

  const text = result.text;
  console.log('RAW TEXT SAMPLE:', text.substring(0, 500))
  return text
}

export function segmentChapters(text: string) {
  const chapterRegex = /\n(?:CHAPTER|Chapter)\s+([A-Z0-9]+)[\s:]*(.*)/g
  const chapters = []
  let match
  let lastIndex = 0
  let lastChapter: any = null

  const getPageNum = (str: string, position: number) => {
    const substr = str.substring(0, position)
    const matches = [...substr.matchAll(/\[PAGE_(\d+)\]/g)]
    return matches.length > 0 ? parseInt(matches[matches.length - 1][1]) : 1
  }

  while ((match = chapterRegex.exec(text)) !== null) {
    if (lastChapter) {
      lastChapter.content = text.substring(lastIndex, match.index).trim()
      lastChapter.pageEnd = getPageNum(text, match.index)
      chapters.push(lastChapter)
    }
    const pageNum = getPageNum(text, match.index)
    lastChapter = {
      num: chapters.length + 1,
      title: match[2]?.trim() || `Chapter ${match[1]}`,
      pageStart: pageNum,
      pageEnd: pageNum,
      content: '',
    }
    lastIndex = match.index + match[0].length
  }

  if (lastChapter) {
    lastChapter.content = text.substring(lastIndex).trim()
    lastChapter.pageEnd = getPageNum(text, text.length)
    chapters.push(lastChapter)
  } else {
    // No chapter headings found — treat whole book as one section
    chapters.push({
      num: 1,
      title: 'Full Text',
      pageStart: 1,
      pageEnd: getPageNum(text, text.length),
      content: text.trim(),
    })
  }

  return chapters
}
