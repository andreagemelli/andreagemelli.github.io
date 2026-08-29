# andreagemelli.me

Personal site. Markdown in, static HTML out, no framework.

```
content/          markdown (posts/<slug>/index.md are page bundles)
static/           copied verbatim to the site root
build.mjs         the generator, ~380 lines
site.css          the whole design system
dist/             build output (gitignored)
```

## Local

```
npm install
npm run serve     # http://localhost:4000, drafts included, rebuilds on save
npm run build     # production build into dist/
```

`npm run serve` watches `content/`, `static/`, `site.css` and `build.mjs`.
Reload the browser after a change; there is no hot reload.

## Writing

Drop a folder under `content/posts/<slug>/` with an `index.md`:

```yaml
---
title: 'Post title'
date: 2026-08-30
description: "One line, shown in the index and in the meta tags."
tags: ["AI", "Agents"]
ShowToc: true     # optional, needs 3+ headings
draft: true       # optional, excluded unless --drafts
---
```

Images and PDFs go in `images/` and `docs/` next to the `index.md` and are
referenced relatively (`![alt](images/foo.png)`). An italic line directly under
an image, in the same paragraph, renders as that image's caption.

Deployed to GitHub Pages by `.github/workflows/deploy.yml` on push to `main`.
