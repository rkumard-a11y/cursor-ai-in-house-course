# Architecture diagram exports (PNG / SVG)

Generated from [`../ARCHITECTURE.md`](../ARCHITECTURE.md) by the repo script `scripts/export-mermaid-diagrams.mjs`.

## Quick commands (repository root)

| Command | Output |
|---------|--------|
| `npm run diagrams:export` | **SVG** and **PNG** for every diagram |
| `npm run diagrams:export:svg` | **SVG** only → `docs/diagrams/svg/` |
| `npm run diagrams:export:png` | **PNG** only → `docs/diagrams/png/` |

Files are named `01-system-context`, `02-monorepo-logical-architecture`, … matching the order of Mermaid blocks in `ARCHITECTURE.md`.

## Prerequisites

- Node.js 20+ (same as the rest of the project).
- `npm install` at the **repository root** so `@mermaid-js/mermaid-cli` is available.
- First `mmdc` run may **download Chromium** (Puppeteer); allow network and a few minutes.

## Optional: Docker (no local Chromium install)

If you prefer not to install Puppeteer’s browser locally:

```bash
docker pull minlag/mermaid-cli
# For each .mmd file under docs/diagrams/build/ after a local script run, or copy blocks to .mmd files:
docker run --rm -u "$(id -u):$(id -g)" -v "$PWD/docs/diagrams:/data" minlag/mermaid-cli \
  -i /data/build/01-system-context.mmd -o /data/svg/01-system-context.svg
```

Generate `.mmd` intermediates first with `npm run diagrams:export:svg` (creates `build/` + `svg/`), or split diagrams manually.

## Vendoring images in git

By default, **`svg/`, `png/`, and `build/`** are listed in the root `.gitignore` so binaries do not land in commits accidentally. To **commit** exports for documentation or slides, remove those lines (or use `git add -f docs/diagrams/svg/*.svg`).
