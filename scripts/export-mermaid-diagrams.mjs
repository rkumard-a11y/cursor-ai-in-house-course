#!/usr/bin/env node
/**
 * Extracts ```mermaid``` blocks from docs/ARCHITECTURE.md and runs @mermaid-js/mermaid-cli (mmdc)
 * to produce SVG and/or PNG files under docs/diagrams/.
 *
 * Usage:
 *   node scripts/export-mermaid-diagrams.mjs           # SVG + PNG
 *   node scripts/export-mermaid-diagrams.mjs --svg-only
 *   node scripts/export-mermaid-diagrams.mjs --png-only
 *
 * Requires: npm install (installs @mermaid-js/mermaid-cli; first run may download Chromium).
 */

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const MD = join(ROOT, 'docs', 'ARCHITECTURE.md')
const OUT_SVG = join(ROOT, 'docs', 'diagrams', 'svg')
const OUT_PNG = join(ROOT, 'docs', 'diagrams', 'png')
const BUILD = join(ROOT, 'docs', 'diagrams', 'build')

/** Slugs must stay in sync with the order of ```mermaid blocks in docs/ARCHITECTURE.md */
const SLUGS = [
  '01-system-context',
  '02-monorepo-logical-architecture',
  '03-data-dependencies',
  '04-qa-test-layers',
  '05-ci-pipeline',
]

function extractMermaidBlocks(source) {
  const re = /```mermaid\n([\s\S]*?)```/g
  const blocks = []
  let m
  while ((m = re.exec(source)) !== null) {
    blocks.push(`${m[1].trim()}\n`)
  }
  return blocks
}

function mmdcBinary() {
  const win = process.platform === 'win32'
  const bin = join(ROOT, 'node_modules', '.bin', win ? 'mmdc.cmd' : 'mmdc')
  if (!existsSync(bin)) {
    console.error(
      'mmdc not found. Run `npm install` at the repository root (devDependency @mermaid-js/mermaid-cli).',
    )
    process.exit(1)
  }
  return bin
}

function runMmdc(input, output) {
  const bin = mmdcBinary()
  const r = spawnSync(bin, ['-i', input, '-o', output], {
    stdio: 'inherit',
    cwd: ROOT,
    shell: process.platform === 'win32',
  })
  if (r.error) throw r.error
  if (r.status !== 0) process.exit(r.status ?? 1)
}

const svgOnly = process.argv.includes('--svg-only')
const pngOnly = process.argv.includes('--png-only')
const wantSvg = !pngOnly
const wantPng = !svgOnly

const md = readFileSync(MD, 'utf8')
const blocks = extractMermaidBlocks(md)

if (blocks.length !== SLUGS.length) {
  console.error(
    `Expected ${SLUGS.length} mermaid blocks in docs/ARCHITECTURE.md, found ${blocks.length}. Update SLUGS or the markdown.`,
  )
  process.exit(1)
}

mkdirSync(OUT_SVG, { recursive: true })
mkdirSync(OUT_PNG, { recursive: true })
mkdirSync(BUILD, { recursive: true })

console.log(`Exporting ${blocks.length} diagram(s) from ${MD}\n`)

for (let i = 0; i < blocks.length; i++) {
  const slug = SLUGS[i]
  const mmd = join(BUILD, `${slug}.mmd`)
  writeFileSync(mmd, blocks[i], 'utf8')

  if (wantSvg) {
    const out = join(OUT_SVG, `${slug}.svg`)
    console.log(`→ ${out}`)
    runMmdc(mmd, out)
  }
  if (wantPng) {
    const out = join(OUT_PNG, `${slug}.png`)
    console.log(`→ ${out}`)
    runMmdc(mmd, out)
  }
}

console.log('\nDone.')
