# CLAUDE.md

## Image Strategy

Full-size source photos are **never committed to git**. They live in `images-src/` (gitignored) and get optimized before use.

### Workflow

1. Drop original photos into `images-src/`
2. Run `npm run optimize`
3. Optimized WebP variants appear in `consultancy/images/`
4. Commit only the WebP output

### How the optimizer works

- Script: `scripts/optimize-images.mjs` (Sharp)
- Output format: **WebP only** (no JPEG fallback — 97%+ browser support)
- Two sizes per image:
  - `{name}-800w.webp` — hero/gallery display (quality 80)
  - `{name}-160w.webp` — thumbnails at 2x retina (quality 75)
- Incremental: skips images whose output is newer than the source

### HTML conventions

- Hero images use `-800w.webp` with `width="800" height="600" decoding="async" loading="lazy"`
- Thumbnail `<img>` tags use `-160w.webp` with `width="160" height="120" loading="lazy"`
- Gallery thumb buttons store the hero path in `data-src` and alt text in `data-alt`

### Deployment

- Static site on Cloudflare Workers (`wrangler.jsonc`)
- `.assetsignore` excludes `node_modules/`, `scripts/`, `images-src/`, `package.json`, `package-lock.json` from deployment
