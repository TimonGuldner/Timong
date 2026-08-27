# WerkRechner AdSense Recovery – Architecture Audit

Date: 2026-08-27

## Current architecture
- Production source lives in `werkrechner-preview`.
- One SPA shell (`index.html`) contains an initially empty `#app` main region.
- Page content is injected by JavaScript from `pages-*.js` and routing logic.
- Vercel rewrites clean URLs such as `/tools/:slug` and `/ratgeber/:slug` to the same SPA `index.html`.
- `seo-route-bootstrap.js` converts clean paths to hash routes.
- `seo-production.js` changes canonical/title/description after JavaScript rendering.

## Current SEO / AdSense risks
1. Initial HTML does not contain the page-specific main content.
2. Initial canonical points to the homepage and is later changed by JavaScript.
3. Internal navigation frequently uses `#tool/...` / `#guide/...` fragments rather than crawlable canonical URLs.
4. Many public URLs return the same HTML shell before rendering.
5. Unknown routes can be swallowed by SPA routing instead of behaving as real 404s.
6. Important editorial content is injected late by `depth-v4.js`, `lowvalue-v3.js`, `individual-tips-v5.js` and related enhancement scripts.
7. Trust/privacy pages are defined or overridden in multiple JavaScript files.
8. Consent logic exists in more than one layer and a custom banner must not be treated as a Google-certified CMP.

## Duplicate / competing definitions
- `pages-legal.js`, `pages-guides-3.js`, `privacy-contact-v19.js`, and `adsense-legal-v7.js` contain overlapping trust/privacy page definitions.
- `index.html` contains an inline consent layer while `cookie-consent-v8.js` contains another consent implementation.
- `seo-route-bootstrap.js` and `seo-production.js` compensate for SPA routing instead of serving correct metadata at request time.

## Recovery architecture
- Add a build-time static generator.
- Generate one real HTML file per canonical public route into `dist/`.
- Generate page-specific title, description, canonical, H1 and editorial body at build time.
- Replace hash navigation with canonical path links.
- Generate dedicated tool pages from existing Tool/Insight/Formula/FAQ data.
- Keep calculator interactivity through a small progressive-enhancement runtime only.
- Consolidate trust/legal pages into the generator as a single production source of truth.
- Disable ad/tracking runtime during review; keep AdSense ownership meta and `ads.txt`; require a certified CMP before future EEA/UK/CH ad activation.
- Generate sitemap/robots/404 from the same route registry.

## Files planned
- `build-static.cjs` (new)
- `package.json` (new)
- `werkrechner-preview/calculator-runtime.js` (new)
- `werkrechner-preview/site-runtime.js` (new)
- `vercel.json` (replace SPA rewrites with build/output configuration)

Legacy SPA files remain in source temporarily as data/content inputs where useful, but the production build will not load SPA routing, SEO patching, or duplicate consent scripts.
