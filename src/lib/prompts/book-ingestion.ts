export function buildIngestionPrompt(
  chapterContent: string,
  sessionNum: number,
  pageStart: number,
  pageEnd: number,
  dailyGoalMinutes: number,
) {
  const systemPrompt = `You are an expert curriculum designer turning raw PDF text into structured learning sessions. Respond with ONLY valid raw JSON — no markdown fences, no extra text.`

  const userPrompt = `Analyze this content from pages ${pageStart}–${pageEnd} and create a focused learning session for a student with ${dailyGoalMinutes} minutes/day to study.

Content:
${chapterContent.substring(0, 18000)}

Return ONLY this JSON structure:
{
  "title": "Concise, engaging session title based on the actual content (not just 'Session N')",
  "summary": "Clear 3–5 sentence explanation of what this session covers, written as study notes the learner can read and understand immediately",
  "concepts": ["Key concept 1", "Key concept 2", "Key concept 3", "Key concept 4", "Key concept 5"],
  "difficulty": 3,
  "quiz_hints": ["One sentence describing a good quiz question for concept 1", "One sentence for concept 2", "One sentence for concept 3"]
}

Rules:
- title: specific to the content, not generic
- summary: written for a learner, not a table of contents
- concepts: 4–8 specific, learnable concepts found in this exact content
- difficulty: 1 (introductory) to 5 (expert-level)
- quiz_hints: one testable question hint per concept (3 minimum)`

  return { systemPrompt, userPrompt }
}
