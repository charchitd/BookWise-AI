const pdfParse = require('pdf-parse');
import { createAdminClient } from './supabase';

export async function extractText(storageUrl: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase.storage.from('books').download(storageUrl)
  
  if (error || !data) {
    throw new Error('Failed to download PDF from storage')
  }
  
  const arrayBuffer = await data.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  
  // Custom render page to include [PAGE_X]
  const render_page = (pageData: any) => {
    let render_options = {
      normalizeWhitespace: false,
      disableCombineTextItems: false
    }
    return pageData.getTextContent(render_options).then(function(textContent: any) {
      let text = '';
      for (let item of textContent.items) {
        text += item.str + ' ';
      }
      return `\n[PAGE_${pageData.pageIndex + 1}]\n` + text;
    })
  }

  const pdfData = await pdfParse(buffer, { pagerender: render_page })
  return pdfData.text
}

export function segmentChapters(text: string) {
  // detect chapter boundaries using regex for Chapter N, numbered headings, and TOC patterns
  const chapterRegex = /\n(?:CHAPTER|Chapter)\s+([A-Z0-9]+)[\s:]*(.*)/g;
  const chapters = [];
  let match;
  let lastIndex = 0;
  let lastChapter: any = null;

  const getPageNum = (str: string, position: number) => {
    const substr = str.substring(0, position);
    const matches = [...substr.matchAll(/\[PAGE_(\d+)\]/g)];
    if (matches.length > 0) {
      return parseInt(matches[matches.length - 1][1]);
    }
    return 1; // Default if not found
  }

  while ((match = chapterRegex.exec(text)) !== null) {
    if (lastChapter) {
      const content = text.substring(lastIndex, match.index).trim();
      lastChapter.content = content;
      lastChapter.pageEnd = getPageNum(text, match.index);
      chapters.push(lastChapter);
    }
    const pageNum = getPageNum(text, match.index);
    lastChapter = {
      num: chapters.length + 1,
      title: match[2]?.trim() || `Chapter ${match[1]}`,
      pageStart: pageNum,
      pageEnd: pageNum, // will be updated
      content: ""
    };
    lastIndex = match.index + match[0].length;
  }

  if (lastChapter) {
    lastChapter.content = text.substring(lastIndex).trim();
    lastChapter.pageEnd = getPageNum(text, text.length);
    chapters.push(lastChapter);
  } else {
    // If no chapters found, treat the whole book as "Full Text"
    chapters.push({
      num: 1,
      title: "Full Text",
      pageStart: 1,
      pageEnd: getPageNum(text, text.length),
      content: text.trim()
    });
  }

  return chapters;
}
