# Sanity-backed story content

One Sanity document drives:

- the homepage article card headline and summary;
- the article page start (headline, summary, byline, published, updated);
- repeated display copy across the mirrored article and breaking pages (firm, advisor, losses, stat cards, ticker, tags);
- the shared Netlify Function response at `/api/sanity-content`.

The URL `/markets/edward-jones-louisiana-investigation/` is unchanged.

## Project details

- Project ID: `5758yrpf`
- Assumed dataset: `production`
- Document ID: `cnnReportStory.edward-jones-louisiana-investigation`
- Schema: `sanity/schemaTypes/cnnReportStory.ts`
- Seed document: `sanity/seed/cnnReportStory.json`

## Deployed Studio

- Studio: https://cnn-report-sanity-studio.netlify.app
- Sign in with a Sanity account that has access to project `5758yrpf`.
- The Studio origin is already allowlisted in Sanity CORS with credentials enabled. If you deploy Studio to a different URL, run `npx sanity cors add <studio-url> --credentials` in `sanity/`.
- Create/edit the **CNN Report Story** document with ID `cnnReportStory.edward-jones-louisiana-investigation`.
- After publishing, the open website updates automatically within about 2 seconds.

The Studio is a separate Netlify project from the website, so editing there cannot overwrite the mirrored site.

## Netlify environment variables

Set these in the Netlify UI (Site configuration → Environment variables) or with the Netlify CLI. Do **not** put them in `netlify.toml` or any repository file.

- `SANITY_PROJECT_ID` = `5758yrpf`
- `SANITY_DATASET` = `production`
- `SANITY_API_TOKEN` = required read token; the `production` dataset is private and the token is already set as a Netlify secret

The function uses `SANITY_API_TOKEN` for every read. If the document is missing or reads are blocked, it serves the bundled fallback copy. Never put the token in `netlify.toml`, source files, or git.

The function disables CDN and browser caching, and every page polls `/api/sanity-content` every 2 seconds. A published Studio edit appears on an already-open page within about 2 seconds; no manual reload or cache purge is needed.

## Seed the document

The document is already seeded. To re-seed it, log in with the Sanity CLI and use the document command (this avoids API-token host issues):

```powershell
cd sanity
npm install
npx sanity login
$env:SANITY_API_TOKEN = (Get-Content "$env:USERPROFILE\.config\sanity\config.json" -Raw | ConvertFrom-Json).authToken
npx sanity documents create seed/cnnReportStory.json --replace
Remove-Item Env:SANITY_API_TOKEN
```

Never print or commit the token. The CLI reads it from its local config only for this command.

## Edit content

Install and run the local Studio from `sanity/`:

```powershell
npm install
npm run dev
```

Edit **Global Article Information** first. It is the single source of truth for the six shared values:

- `advisorName` — `Beau Wilson`
- `location` — `Louisiana`
- `publishedDate` — `August 16, 2026`
- `updatedTime` — `4:18 PM ET`
- `totalLosses` — `$1.3B+`
- `firmName` — `Edward Jones`

Publishing a change there updates the homepage article preview, the full article page, the breaking page, and every repeated occurrence of those values. The standalone duplicate location label is intentionally hidden; the location inside story copy is driven by the global field.

The **CNN Report Story** document now holds only story-specific copy. Its headline, dek, blurbs and recurring blocks use tokens such as `{{firmName}}`, `{{location}}`, `{{advisorName}}`, `{{publishedDate}}`, `{{updatedTime}}` and `{{lossesShort}}`. Do not type the shared values directly into those fields.

The homepage card link remains `/markets/edward-jones-louisiana-investigation/`. The renderer overlays the global values onto the existing `/api/content` feed, then replaces remaining visible occurrences on the mirrored pages. Video sources and playback behavior are not touched.
