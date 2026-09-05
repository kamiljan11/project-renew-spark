# MAS Parts — Sourcing & Import to Iceland (prototype)

**Status: prototype (2026-08) — not maintained**

A prototype request-to-quote tool for buying car parts and goods from EU suppliers and
importing them to Iceland: a request form, an AI-assisted intake (`form-assist` edge function,
calling `google/gemini-2.5-flash` to turn a vague description into a structured request), and an
admin back office for triaging requests. Six Supabase migrations — a shallow schema,
consistent with an early-stage exploration rather than a finished product.

## Stack

React + TypeScript · Vite · TanStack Router/Start · Tailwind CSS · Supabase (Postgres, Auth, RLS,
Edge Functions).

## Running locally

```bash
npm install
npm run dev
```

Needs a Supabase project. The app reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
from the environment — no `.env.example` is checked into this repo.

```bash
npm run lint
npm run build
```

## License

All rights reserved — see [LICENSE](./LICENSE).
