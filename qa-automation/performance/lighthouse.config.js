/**
 * Lighthouse CI — run from repo root with dev server or preview up:
 *   cd qa-automation && npx lhci autorun --config=performance/lighthouse.config.js
 */
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      url: [process.env.LHCI_URL || 'http://127.0.0.1:5173'],
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        preset: 'desktop',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.35 }],
        'categories:accessibility': ['warn', { minScore: 0.85 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
