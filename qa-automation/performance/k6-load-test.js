/**
 * k6 smoke + light load — run: k6 run qa-automation/performance/k6-load-test.js
 * Env: K6_BASE_URL (default http://127.0.0.1:5173)
 */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

const errorRate = new Rate('errors')

export const options = {
  vus: 3,
  duration: '20s',
  thresholds: {
    // Align with quality/quality-targets.json: p95 under 500ms, error rate under 1%.
    http_req_duration: ['p(95)<500'],
    errors: ['rate<0.01'],
  },
}

const BASE = __ENV.K6_BASE_URL || 'http://127.0.0.1:5173'

export default function () {
  const res = http.get(BASE)
  const ok = check(res, {
    'status 200': (r) => r.status === 200,
  })
  errorRate.add(!ok)
  sleep(0.3)
}
