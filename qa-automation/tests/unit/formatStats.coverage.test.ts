import { formatCompactCount, statAriaLabel } from '../../../src/components/features/UserProfile/formatStats'

describe('repo src coverage (via formatStats)', () => {
  it('formats compact counts', () => {
    expect(formatCompactCount(42)).toBe('42')
    expect(formatCompactCount(1500)).toBe('1.5K')
  })

  it('builds aria label', () => {
    expect(statAriaLabel('posts', 3)).toMatch(/3/)
    expect(statAriaLabel('posts', 3)).toContain('posts')
  })
})
