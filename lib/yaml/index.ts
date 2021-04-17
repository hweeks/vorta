import { PathLike } from "fs"
import { resolve } from "path"
import { readdirSync, readSync, statSync } from "../core-utils"
import yaml from "js-yaml"

export interface VortaStepBase {
  success?: string
  failure?: string
}

export interface VortaTask extends VortaStepBase {
  if?: string
  script: string
  ignoreFailure?: boolean
  parallel?: boolean
}

export interface VortaFlow extends VortaStepBase {
  tasks: string[]
}

export interface VortaConfig {
  version: number
  tasks: Record<string, VortaTask>
  flows: Record<string, VortaFlow>
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type YamlConf = string | number | object | null | undefined

export const processYaml = (yamlFiles: string[]): VortaConfig[] => {
  return yamlFiles.map((yamlFile) => yaml.load(yamlFile)) as VortaConfig[]
}

export const getYamlFiles = async (cwd: PathLike): Promise<string[]> => {
  const possibleJems = resolve(cwd.toString(), "./jems")
  let jemStats
  try {
    jemStats = await statSync(possibleJems)
  } catch (error) {
    if (!jemStats) {
      throw new Error(
        `I'm going to be honest here, I can't find anything worth it's mustard in ${possibleJems}`
      )
    }
  }
  if (jemStats && !jemStats.isDirectory()) {
    throw new Error(
      `I'm going to be honest here, I can't find anything worth loading in ${possibleJems}`
    )
  }
  const allJems = await readdirSync(possibleJems)
  return await Promise.all(
    allJems.map(
      async (jem) => await readSync(resolve(possibleJems, jem), "utf8")
    )
  )
}

export const findParseAndReturnYaml = async (
  cwd: PathLike
): Promise<VortaConfig[]> => {
  const yamlFiles = await getYamlFiles(cwd || process.cwd())
  return processYaml(yamlFiles)
}
