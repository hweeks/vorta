#!/usr/bin/env node

import yargs, { Argv } from "yargs";
import { findParseAndReturnYaml } from "./yaml";
import { runAFlow } from "./runner";

yargs
  .command(
    'flow <name>',
    'run a flow of a given name',
    (yargInput: Argv) => {
      return yargInput.option('name', {
        describe: 'The flow you wish to execute',
        default: ''
      })
    },
    async function ({name}) {
      const yml = await findParseAndReturnYaml(process.cwd())
      runAFlow(name, yml);
    }
  )
  .help()
  .argv

