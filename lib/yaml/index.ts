import { PathLike } from "fs";
import { getYamlFiles } from "./find";
import { processYaml, VortaConfig } from './parse'

export const findParseAndReturnYaml = async (cwd: PathLike) : Promise<VortaConfig[]> => {
  const yamlFiles = await getYamlFiles(cwd || process.cwd())
  return processYaml(yamlFiles)
}
