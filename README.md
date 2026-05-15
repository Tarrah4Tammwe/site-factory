# Site Factory

Private AI-powered utility site builder. Chat interface for researching, planning, and generating complete Next.js repos pushed directly to GitHub.

## Setup

### 1. Clone and install
```bash
git clone https://github.com/Tarrah4Tammwe/site-factory
cd site-factory
npm install
```

### 2. Environment variables
Copy `.env.example` to `.env.local` and fill in:

| Variable | Where to get it |
|---|---|
| `FACTORY_PASSWORD` | Make up a strong password — only you use this |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com |
| `GITHUB_TOKEN` | https://github.com/settings/tokens (needs: repo, workflow) |
| `GITHUB_USERNAME` | Tarrah4Tammwe |
| `GOOGLE_SEARCH_API_KEY` | https://console.cloud.google.com → Custom Search API |
| `GOOGLE_SEARCH_ENGINE_ID` | https://programmablesearchengine.google.com → Create engine → set to "Search the entire web" |

### 3. Run locally
```bash
npm run dev
```
Visit http://localhost:3000

### 4. Deploy to Vercel
- Push to GitHub
- Import to Vercel
- Add all environment variables in Vercel project settings
- Deploy

## Google Custom Search Setup

1. Go to https://programmablesearchengine.google.com
2. Create a new search engine
3. Set it to **Search the entire web**
4. Copy the Search engine ID → `GOOGLE_SEARCH_ENGINE_ID`
5. Go to https://console.cloud.google.com
6. Enable **Custom Search API**
7. Create credentials → API key → `GOOGLE_SEARCH_API_KEY`

Free tier: 100 queries/day. Each site build uses ~4-6 queries.

## Usage

1. Visit your deployed URL
2. Enter your `FACTORY_PASSWORD`
3. Describe what you want to build
4. The app researches, plans, and generates a complete repo
5. Say "push to GitHub" to create the repo automatically

## What it builds

- **Answer Sites** — Plain English Q&A with 15-25 pages, AdSense, SEO
- **Calculators** — Interactive tools with optional Stripe premium product

All sites include: AdSense (pub-8935274984783226), Propeller Ads, ads.txt, sitemap, robots, canonical, JSON-LD, security headers.
