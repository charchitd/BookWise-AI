const OPENROUTER_BASE = "https://openrouter.ai/api/v1"

interface Message {
  role: "system" | "user" | "assistant"
  content: string
}

export async function streamOpenRouter(messages: Message[], model = "google/gemini-2.5-flash"): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.Claude_API_Key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://bookwise.ai",
      "X-Title": "BookWise AI",
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      max_tokens: 1024,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenRouter error ${res.status}: ${err}`)
  }

  const encoder = new TextEncoder()
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()

  return new ReadableStream({
    async start(controller) {
      let buffer = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const data = line.slice(6).trim()
          if (data === "[DONE]") { controller.close(); return }
          try {
            const json = JSON.parse(data)
            const text = json.choices?.[0]?.delta?.content ?? ""
            if (text) controller.enqueue(encoder.encode(text))
          } catch {}
        }
      }
      controller.close()
    },
  })
}

export async function callOpenRouter(systemPrompt: string, userPrompt: string, model = "google/gemini-2.5-flash"): Promise<string> {
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.Claude_API_Key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://bookwise.ai",
      "X-Title": "BookWise AI",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.1,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenRouter error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ""
}
