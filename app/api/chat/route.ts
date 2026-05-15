import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT } from '@/lib/system-prompt'
import { multiSearch, formatResearchForPrompt } from '@/lib/research'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(request: Request) {
  // Simple password auth
  const body = await request.json()
  const { messages, password } = body

  if (password !== process.env.FACTORY_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'Invalid messages' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Check if the latest message is a research trigger
  const lastMessage = messages[messages.length - 1]
  const lastContent = lastMessage?.content?.toLowerCase() || ''

  // Auto-trigger research if user is describing a new site idea
  const isNewSiteDescription =
    messages.length <= 3 &&
    (lastContent.includes('build') ||
      lastContent.includes('create') ||
      lastContent.includes('site') ||
      lastContent.includes('calculator') ||
      lastContent.includes('tool') ||
      lastContent.includes('explained') ||
      lastContent.includes('guide'))

  let researchContext = ''

  if (isNewSiteDescription && process.env.GOOGLE_SEARCH_API_KEY) {
    // Extract likely topic keywords from the message for research
    // We'll do a quick search to give the AI real data
    const topic = lastMessage.content.substring(0, 100)
    try {
      const research = await multiSearch([
        `${topic} questions people ask`,
        `${topic} UK search`,
      ])
      researchContext = formatResearchForPrompt(research)
    } catch {
      // Research failed, continue without it
    }
  }

  // Build the system prompt, optionally injecting research data
  const systemPrompt = researchContext
    ? `${SYSTEM_PROMPT}\n\n## LIVE RESEARCH DATA (from Google Custom Search)\n${researchContext}`
    : SYSTEM_PROMPT

  try {
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 8096,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    // Return a streaming response
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              const data = JSON.stringify({ text: chunk.delta.text })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err: any) {
    console.error('Anthropic API error:', err)
    return new Response(
      JSON.stringify({ error: err.message || 'AI request failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
