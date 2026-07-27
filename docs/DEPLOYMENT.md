# Deployment Runbook

*Written July 2026 during the blue/green migration: the original production (Vercel web + Render API at bs-api-h3dy.onrender.com) lives under a volunteer's accounts; this runbook stands up a parallel deployment under movement-controlled accounts, verifies it, then swaps the domain.*

## Architecture

- **Web** (apps/web, Next.js): Vercel. AI server actions run here, so the web deployment needs the Groq key
- **API** (apps/server, Bun + Elysia): Render. Serves the syllabus dataset (baked at build time via `bun run sync`), share links, and classrooms (Upstash Redis)
- **Data**: WikiSyllabus → `bun run sync` at API build time. The GitHub sync workflow additionally refreshes `syllabus.json` in-repo every 6 hours once its `GH_TOKEN` secret is restored

## Step 1: API on Render (~5 minutes of clicks)

1. Create/log into [render.com](https://render.com) with the movement's GitHub
2. New → **Blueprint** → select this repo. Render reads [`render.yaml`](../render.yaml) and preconfigures the service
3. In the service's **Environment** tab, paste the two secrets it deliberately does not store: `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_TOKEN` (from the Upstash console, or a fresh free Upstash database if the old one is also volunteer-held)
4. Deploy; note the service URL (e.g. `https://beyond-syllabus-api.onrender.com`) and check it returns `OK` at `/`

## Step 2: Web on Vercel (~5 minutes of clicks)

1. Create/log into [vercel.com](https://vercel.com) with the movement's GitHub
2. Add New → Project → import this repo. Set **Root Directory: `apps/web`** ([`vercel.json`](../apps/web/vercel.json) supplies the rest)
3. Environment variables:
   - `NEXT_PUBLIC_SERVER_URL` = the Render URL from Step 1
   - `GROQ_API_KEY` = from the Groq console
4. Deploy; note the `.vercel.app` URL
5. Back on Render, add that URL to `CORS_ORIGIN`

## Step 3: Verify the new deployment

Golden path on the `.vercel.app` URL: /select loads universities → subject page → **Brainstorm** produces real AI turns → Question Sheet exports → /journey shows progress → /teach round-trips a classroom code → phone: install the PWA, airplane mode, revisit a cached syllabus.

## Step 4: The swap (when volunteer credentials arrive)

1. In the old Vercel account: remove the `beyondsyllabus.in` domain from the old project (keep the project as archive)
2. In the new Vercel project: add `beyondsyllabus.in` (DNS may need repointing if the domain registrar entry targets the old project; Vercel shows the exact records)
3. Add `https://beyondsyllabus.in` to the Render `CORS_ORIGIN`
4. Old Render API can be suspended after a week of quiet
5. Thank the volunteer publicly; their deployment carried the project through its first era

## Maintenance notes

- Render free tier sleeps on idle: first request after sleep takes ~30s. Fine for testing; move to the $7 tier before the September launch traffic
- To refresh syllabus data without a code push: Render dashboard → Manual Deploy (build re-runs `bun run sync`)
- Secrets live only in platform dashboards, never in this repo
