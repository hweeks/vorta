import { base } from "../lib";

describe('base test', () => {
  test('should be a todo for now', () => {
    expect(base).toContain('todo')
  })
})
