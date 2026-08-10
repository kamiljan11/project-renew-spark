# MAS Parts — Sourcing & Import to Iceland

**Status:** production · Part of the [MAS Group](https://masgroup.is) platform · Built by [Kamil Jan](https://kamiljan.com)

Request-to-quote service for buying parts and goods from European suppliers and getting them
to Iceland. A customer or workshop describes what they need; MAS verifies availability,
quotes the full landed cost including shipping and customs, buys it, ships it, clears it, and
hands over an Icelandic VAT invoice.

The point of the product is that the customer never touches a customs form.

## What it does

- **Request form** for parts and goods, with an AI assistant that helps turn a vague
  description ("front wishbone, 2014 Octavia") into a request precise enough to source
- **Quote flow** — availability check, full landed price, explicit yes before any money moves
- **Icelandic VAT invoicing** for business customers
- **Admin back office** for triaging incoming requests

## Stack

React + TypeScript · Vite · TanStack Router · Tailwind CSS · Supabase (Postgres, Auth, RLS,
Edge Functions) · hosted on Lovable.

The `form-assist` edge function calls Gemini 2.5 Flash through the Lovable AI gateway. It is
deliberately a cheap, fast model: the job is tidying a form field, not reasoning.

## Running locally

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` and provide your own Supabase project URL and publishable key.

```bash
npm run lint
npm run build
npx tsc -b        # note: -b, not --noEmit (project references)
```

## How security is handled

- No secrets in the repo. The AI gateway key is read from the environment inside the edge
  function and never reaches the browser; `.env` holds only the Supabase publishable key.
- Row Level Security in Postgres is the authorisation boundary.
- Every push runs build, lint, typecheck, tests, Semgrep and a Gitleaks secret scan; a
  pre-commit hook blocks credential-shaped strings.
- Customer requests stay in the database — no real data in fixtures.

## Licence

Proprietary. Published for reference, not for reuse.
