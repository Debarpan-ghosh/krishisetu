# KrishiSetu

Farm-gate to market — a voice-first agri-marketplace demo connecting farmers directly
to buyers, with escrow-protected payments and delivery tracking.

Team INFOSIX · Smart India Hackathon 2026 · SIH26033

## Tech stack

- React 18 + Vite
- Tailwind CSS
- lucide-react (icons)

This is a frontend demo build: listings, pricing, and order tracking are mocked
client-side state (see `src/App.jsx`), not backed by a real API yet.

## Run locally

```bash
npm install
npm run dev
```

App runs at http://localhost:5173

## Build for production

```bash
npm run build
npm run preview   # serve the built dist/ locally to sanity-check
```

## Run with Docker

```bash
docker compose up --build
```

App runs at http://localhost:8080

## CI/CD

- **CI** (`.github/workflows/ci.yml`): every push/PR to `main` or `develop` runs
  lint + build via GitHub Actions.
- **Deploy**: recommended path is connecting this repo directly at
  [vercel.com/new](https://vercel.com/new) — auto-deploys `main` to production and
  gives every PR a preview URL, no YAML needed. An optional
  `.github/workflows/deploy.yml` is included if you'd rather trigger deploys from
  CI (needs a `VERCEL_TOKEN` secret).

## Project structure

```
src/
  App.jsx       # all views + components (landing, farmer flow, marketplace, tracking)
  main.jsx      # React entry point
  index.css     # Tailwind directives
```

## Roadmap (post-hackathon)

- Replace mocked mandi price ticker with a real price-feed API
- Replace mocked voice transcription with a real speech-to-text service
- Wire escrow flow to an actual payment provider
- Split `App.jsx` into `components/` and `views/` as the codebase grows
