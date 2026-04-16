/**
 * Jest unit smoke — independent of React; validates Jest + ts-jest wiring.
 */
describe('QA Jest harness', () => {
  it('runs TypeScript tests', () => {
    expect([1, 2, 3].length).toBe(3)
  })
})
