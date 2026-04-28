export function buildQuizPrompt(concepts: string[], chapterSummaries: string) {
  return {
    systemPrompt: `You are an expert quiz designer. Generate multiple-choice questions to test understanding of key concepts. You must respond with ONLY valid JSON and no other text.`,
    userPrompt: `Generate 5 multiple-choice quiz questions testing the following concepts:
Concepts: ${concepts.join(", ")}

Context from the book:
${chapterSummaries}

Return ONLY valid JSON in exactly this format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_index": 0,
    "explanation": "Brief explanation of why this is correct."
  }
]

Make questions challenging but fair. Test conceptual understanding, not memorization.`
  }
}
