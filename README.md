# Outfitfy — AI Wardrobe Studio

Turn photos and Pinterest boards into a shoppable, mixable digital closet.
Outfitfy runs entirely in the browser by default — your wardrobe lives in
**IndexedDB**, no account required — with an optional cloud-sync layer for
when you want it.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4** + hand-built shadcn/ui-style primitives (Radix UI under the hood)
- **Dexie.js** over IndexedDB for local-first storage (`src/lib/db.ts`)
- **Recharts** for the wardrobe cost dataviz
- **Zustand** for the Try-On canvas session state
- **NextAuth v5** as an optional, off-by-default cloud-sync layer

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app works fully
offline/without any API keys — every AI integration (vision tagging,
segmentation, retail matching, virtual try-on, Pinterest import) has a
realistic mock fallback so you can exercise the entire pipeline immediately.
Use **"Load sample wardrobe"** on the empty Closet page to seed demo data.

## Wiring up real AI providers

Copy `.env.example` to `.env.local` and fill in what you want to go live:

| Feature | Env vars | Provider |
|---|---|---|
| Detection & tagging | `GEMINI_API_KEY` (preferred, free tier) or `OPENAI_API_KEY` (fallback) | Gemini 2.0 Flash vision / gpt-4o-mini vision |
| Segmentation / background removal | `REPLICATE_API_TOKEN`, `REPLICATE_SAM_MODEL_VERSION` | Segment Anything on Replicate |
| Virtual try-on | `REPLICATE_API_TOKEN`, `REPLICATE_VTON_MODEL_VERSION` | IDM-VTON on Replicate |
| Tiered retail matching | `SERPAPI_API_KEY` (preferred, free tier) or `RETAIL_SEARCH_API_KEY`+`RETAIL_SEARCH_ENDPOINT` (custom aggregator) | SerpApi Google Shopping / your own endpoint |
| Pinterest board import | `PINTEREST_CLIENT_ID`, `PINTEREST_CLIENT_SECRET` | Pinterest Developer API (OAuth) |
| Cloud sync (optional) | `AUTH_SECRET` + one of `GOOGLE_CLIENT_ID`/`SECRET` or `GITHUB_CLIENT_ID`/`SECRET` | NextAuth |

Every one of these degrades gracefully: unset keys mean the corresponding
`src/lib/ai/*` module (or `src/lib/pinterest.ts`) returns structured mock
data instead of calling out, so the ingestion queue, matching cards, planner,
and try-on canvas all stay fully functional in local/offline dev.

## Architecture

```
src/
  app/
    (app)/            # sidebar shell + all main routes (dashboard, closet, ingest, inspiration, try-on, planner)
    api/               # route handlers: vision tagging, segmentation, retail search, VTO, Pinterest OAuth, NextAuth
  components/
    ui/                # hand-built shadcn-style primitives
    closet/            # item card, retail tier row, item detail dialog
    ingest/            # dropzone, Pinterest connect, processing queue list
    try-on/            # model picker, garment picker, composite canvas
    planner/           # day picker dialog
    charts/            # tier cost bar chart + KPI stat tiles (CVD-validated palette)
  lib/
    db.ts              # Dexie schema — closetItems, outfits, plannerEntries, inspirationLooks, ingestJobs, modelPhotos, vtoResults
    types.ts           # shared domain types
    ingest.ts           # client-side pipeline orchestrator (tag -> segment -> match -> save)
    ai/                # server-only AI integrations with mock fallbacks
    pinterest.ts       # Pinterest OAuth + board/pin fetchers with mock fallback
    planner.ts         # weighted weekly outfit generator (prioritizes underused pieces)
    pricing.ts         # tiered cost aggregation for the dashboard chart
    seed.ts            # curated inspiration gallery + demo closet seed data
```

### Ingestion pipeline

Each uploaded photo or imported Pinterest pin becomes an `IngestJob`
(`src/lib/db.ts`) that moves through `queued -> tagging -> segmenting ->
matching -> done`, driven client-side by `processIngestJob` in
`src/lib/ingest.ts`. Every step is a plain Next.js Route Handler under
`src/app/api/`, so it's straightforward to swap in real model calls.

### Digital closet cost dataviz

The dashboard's tier-comparison chart uses a CVD-validated categorical
palette (see `src/app/globals.css` `--luxury`/`--premium`/`--budget` and the
`dataviz` design system) — validated with the palette contrast/CVD checker
for both light and dark surfaces.
