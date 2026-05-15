import { multiSearch, formatResearchForPrompt } from '@/lib/research'

export async function POST(request: Request) {
  const body = await request.json()
  const { queries, password } = body

  if (password !== process.env.FACTORY_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!queries || !Array.isArray(queries)) {
    return new Response(JSON.stringify({ error: 'queries must be an array' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const results = await multiSearch(queries.slice(0, 10))
    const formatted = formatResearchForPrompt(results)
    return Response.json({ results, formatted })
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Research failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
