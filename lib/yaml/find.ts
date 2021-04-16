import { PathLike } from 'fs'
import { relative, resolve } from 'path'
import { readdirSync, readSync, statSync } from '../core-utils'


export const getYamlFiles = async (cwd: PathLike): Promise<string[]> => {
  const possibleJems = relative(cwd.toString(), './jems')
  const jemStats = await statSync(possibleJems)
  if (!jemStats.isDirectory()) {
    throw new Error(`I'm going to be honest here, I can't find anything worth it's mustard in ${possibleJems}`)
  }
  const allJems = await readdirSync(possibleJems)
  return await Promise.all(allJems.map(async (jem) => await readSync(resolve(possibleJems, jem), 'utf8')))
}
