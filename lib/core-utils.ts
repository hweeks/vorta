import { readFile, stat, readdir } from "fs"
import { exec, spawn } from "child_process"
import { promisify } from "util"

export const statSync = promisify(stat)
export const readSync = promisify(readFile)
export const readdirSync = promisify(readdir)
export const execSync = promisify(exec)
export const spawnSync = promisify(spawn)
