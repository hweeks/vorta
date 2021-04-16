import yaml from 'js-yaml'

export interface VortaStepBase {
  success?: string
  failure?: string
}

export interface VortaTask extends VortaStepBase{
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

export const processYaml = (yamlFiles : string[]) : VortaConfig[] => {
  return yamlFiles.map(yamlFile => yaml.load(yamlFile)) as VortaConfig[];
}
