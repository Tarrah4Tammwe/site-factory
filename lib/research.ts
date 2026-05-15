export interface SearchResult {
  title: string
  link: string
  snippet: string
}

export interface ResearchData {
  query: string
  results: SearchResult[]
  relatedQueries?: string[]
}

export async function googleSearch(query: string, numResults = 10): Promise<ResearchData> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID

  if (!apiKey || !engineId) {
    return {
      query,
      results: [],
      relatedQueries: [],
    }
  }

  const url = new URL('https://www.googleapis.com/customsearch/v1')
  url.searchParams.set('key', apiKey)
  url.searchParams.set('cx', engineId)
  url.searchParams.set('q', query)
  url.searchParams.set('num', String(Math.min(numResults, 10)))
  url.searchParams.set('gl', 'gb') // UK results
  url.searchParams.set('hl', 'en-GB')

  const res = await fetch(url.toString())
  if (!res.ok) return { query, results: [] }

  const data = await res.json()

  const results: SearchResult[] = (data.items || []).map((item: any) => ({
    title: item.title,
    link: item.link,
    snippet: item.snippet,
  }))

  // Extract related searches if available
  const relatedQueries = (data.queries?.relatedSearch || []).map(
    (r: any) => r.searchTerms
  )

  return { query, results, relatedQueries }
}

export async function multiSearch(queries: string[]): Promise<ResearchData[]> {
  // Sequential to stay within rate limits
  const results: ResearchData[] = []
  for (const query of queries) {
    const result = await googleSearch(query)
    results.push(result)
    // Small delay between requests
    await new Promise((r) => setTimeout(r, 300))
  }
  return results
}

export function formatResearchForPrompt(research: ResearchData[]): string {
  if (!research.length || !research[0].results.length) {
    return 'No search data available — proceeding with knowledge-based research.'
  }

  return research
    .map(
      (r) =>
        `SEARCH: "${r.query}"\n` +
        r.results
          .slice(0, 5)
          .map((result, i) => `  ${i + 1}. ${result.title}\n     ${result.snippet}`)
          .join('\n') +
        (r.relatedQueries?.length
          ? `\n  Related: ${r.relatedQueries.slice(0, 5).join(', ')}`
          : '')
    )
    .join('\n\n')
}
