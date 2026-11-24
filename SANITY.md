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

## Netlify environment variables

Set these in the Netlify UI (Site configuration → Environment variables) or with the Netlify CLI. Do **not** put them in `netlify.toml` or any repository file.

- `SANITY_PROJECT_ID` = `5758yrpf`
- `SANITY_DATASET` = `production`
- `SANITY_API_TOKEN` = optional; a fresh read token is needed only if `production` is private

The API token was shared in chat earlier, so it should be revoked. The function uses `SANITY_API_TOKEN` when it is set and otherwise reads the public dataset. If the document is missing or reads are blocked, it serves the bundled fallback copy.

The function caches responses at the Netlify CDN for 60 seconds with a 5-minute stale-while-revalidate window. After an edit, wait up to a minute or purge the cache, then reload the page.

## Seed the document

The Studio can import `sanity/seed/cnnReportStory.json` directly, or you can run:

```powershell
cd sanity
npm install
$secure = Read-Host -AsSecureString -Prompt "Sanity token"
$env:SANITY_API_TOKEN = [System.Net.NetworkCredential]::new('', $secure).Password
node seed-story.mjs
Remove-Item Env:SANITY_API_TOKEN
```

Never commit the token. The seed script reads it only from `process.env.SANITY_API_TOKEN`.

## Edit content

Install and run the local Studio from `sanity/`:

```powershell
npm install
npm run dev
```

Edit the **CNN Report Story** document. The key fields are:

- `headline` — homepage card and article start;
- `dek` — homepage card, article start, and summary copy;
- `byline`, `publishedDisplay`, `updatedDisplay` — article start metadata;
- `advisorName`, `firmName`, `lossesShort`, `lossesLong` — repeated across visible story copy;
- `location` — leave empty to hide location labels and separators.

The renderer overlays these values onto the existing `/api/content` feed, then replaces remaining visible occurrences on the mirrored pages. Video sources and playback behavior are not touched.
