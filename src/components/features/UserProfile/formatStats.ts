export function formatCompactCount(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`
  }
  if (value >= 10_000) {
    return `${Math.round(value / 1_000)}K`
  }
  if (value >= 1_000) {
    const k = value / 1_000
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`
  }
  return value.toLocaleString()
}

export function statAriaLabel(label: string, value: number): string {
  return `${value.toLocaleString()} ${label}`
}
