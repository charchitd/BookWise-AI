import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function callClaude(systemPrompt: string, userPrompt: string, maxTokens = 1000) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6', // Using exact model name requested
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt }
    ],
  })
  
  const content = response.content[0]
  if (content.type === 'text') {
    return content.text
  }
  return ''
}
