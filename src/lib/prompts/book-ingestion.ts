export function buildIngestionPrompt(chapterContent: string, chapterNum: number, chapterTitle: string) {
  const systemPrompt = `You are an expert curriculum designer extracting structured educational knowledge from book chapters. You must respond with ONLY valid JSON and no other text. Do NOT wrap the JSON in markdown code blocks, just return the raw JSON object.`
  
  const userPrompt = `Extract key educational knowledge from Chapter ${chapterNum}: ${chapterTitle}.

Content to analyze:
${chapterContent.substring(0, 20000)} // Truncated to stay within token limits if excessively long

Return ONLY valid JSON in the exact following format:
{
  "summary": "Detailed summary of the core concepts presented in this chapter...",
  "concepts": ["Concept 1", "Concept 2", "Concept 3"],
  "difficulty": 3
}

Ensure the "difficulty" field is an integer between 1 (very basic) and 5 (highly advanced).`

  return { systemPrompt, userPrompt }
}
