import path from "path"
import { findParseAndReturnYaml } from "../../lib/yaml"

describe("yaml loading", () => {
  test("should load up current yaml config", async () => {
    const allYaml = await findParseAndReturnYaml(process.cwd())
    expect(allYaml[0].version).toContain("1.0.0")
  })
  test("should fail to load up non-existent yaml config", async () => {
    let failed = false
    try {
      await findParseAndReturnYaml(path.relative("../../", __dirname))
    } catch (e) {
      expect(e.message).toContain("mustard")
      failed = true
    }
    expect(failed).toEqual(true)
  })
  test("should fail to load up jem file instead of folder", async () => {
    let failed = false
    try {
      await findParseAndReturnYaml(__dirname)
    } catch (e) {
      expect(e.message).toContain("loading")
      failed = true
    }
    expect(failed).toEqual(true)
  })
})
