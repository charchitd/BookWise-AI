import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function callGemini(systemPrompt: string, userPrompt: string, maxTokens = 1500) {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", // Fast and capable for structural extraction
    systemInstruction: systemPrompt,
  })

  const response = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.1, // Low temperature for consistent JSON extraction
    }
  })

  return response.response.text()
}
