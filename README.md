# vorta

## overview

`vorta` is a tool to configure local environments in much the same way we configure CI/CD pipelines. A lot of the time we build out complex flows for our CI/CD around testing, linting, and deployment. These complex flows are also generally needed for each person's local development environment too, but we don't have a nice tool to handle it. `vorta` is looking to fill in this gap, so that the local environment can be as predictable and reproducible as your CI/CD pipelines.

In an ideal world you'd use vorta calls in your CI/CD pipeline as well. You can even add steps to a pipeline that validate the local env isn't broken by a new change, not just the deployed code.

A developers local environment is as important, if not more so, than production. Let's make sure to validate not just that the repo will release the code, but that local development is stable too!

## how does it work?

`vorta` is designed to look at the `./jems` folder relative to your `cwd` for the `vorta`. In the `./jems` folder you have a series of `.yml` files that can be run. To run a single `jem` you'd call:

```sh
$ vorta <jem-name>
finding <jem-name>...
running <jem-name> steps!
...
vorta ran the <jem-name> in <some>ms!
```

## jems

A `jem`, short for `Jem'Hadar`, is a simple yaml file of this format:

```yml
version: 1.0.0
tasks:
  build-files:
    script: 'yarn run build'
  start-docker:
    if: tasks.build-files.failure != true
    script: 'docker-compose -f ./dc/base.yml up -d'
    failure: 'echo "heck, docker is not working" && exit'
    parallel: true
    ignoreFailure: true
  start-dev:
    script: 'yarn run start'
    success: 'open localhost:3000'
    parallel: true

flows:
  local:
    tasks:
      - build-files
      - start-docker
      - start-dev
    failure: 'node ./report-failure.js --local-broken'
```

## tasks

Tasks are fundamentally a set of bash scripts with a success or failure hook. If you provide a `success` option it will be called on a 0 exit code, the optional `failure` option is called on all non-zero exits. A task can be marked `parallel` if it can or should be run alongside others.

> NOTE: if a script is provided, the success of the task is now determined by that file. If you have a `failure` script that exits with a 0 the rest of the tasks in the flow will be run.

### name

The name of a step needs to be unique. This unique name can be used to validate steps further down with `if` keys.

### script

This is any bash script. We will spin up an SH session and persist _ALL_ env variables to it from the parent.

### if (optional)

This block allows you to access the success/failure of previous steps to determine if a step should be run. This is useful if you want to be able to only clean a cache under certain conditions, or build just parts.

### success (optional)

This script is invoked on a zero exit code. If it throws an error, it will fail the task. When invoked a map is available on `process.vorta` that will provide the task id of all running tasks.

### failure (optional)

This script is invoked on a non-zero exit code. If it throws an error, it will fail the task. When invoked a map is available on `process.vorta` that will provide the task id of all running tasks.

### parallel (optional)

If set to true, indicates that a task can run at the same time as others. We automatically group all `parallel` tasks via a `Promise.all`.

### ignoreFailure (optional)

If set to true, the exit code will be stored in `process.vorta`, but the step will always be a `success`.

## flows

Flows are arrays of tasks to run, checking the status of each step before running the next. If a flow contains a mix of sync and parallel tasks, they execute grouped by `parallel`. For example:

```yml
version: 1.0.0
tasks:
  build-files:
    script: 'yarn run build'
  start-docker:
    script: 'docker-compose -f ./dc/base.yml up -d'
    parallel: true
  start-dev:
    script: 'yarn run start'
    parallel: true
  build-deps:
    script: 'yarn run deps-build'

flows:
  local:
    tasks:
      - build-deps
      - build-files
      - start-docker
      - start-dev
    failure: 'node ./report-failure.js --local-broken'
    exit: 'node ./spindown-local.js'
```

This would execute `build-deps`, then `build-files`, then both `start-docker` and `start-dev` would be started at the same time, with output interleaved.

### name

The name of a flow needs to be unique. This unique name can be used to validate flows further down with `if` keys.

### tasks

This is an array of 'tasks' selected by their name. For a flow to exit 0 all tasks must pass.

### success (optional)

This script is invoked on a zero exit code. If it throws an error, it will fail the flow. When invoked a map is available on `process.vorta` that will provide the task id of all running tasks.

### failure (optional)

This script is invoked on a non-zero exit code. If it throws an error, it will fail the flow. When invoked a map is available on `process.vorta` that will provide the task id of all running tasks.

### exit (optional)

This script is invoked on _any_ exit signal sent by the parent process. Use it to send `SIGINT` and other signals to running child processes. When invoked a map is available on `process.vorta` that will provide the task id of all running tasks.

## process.vorta

This is a helper we provide to enable complex scripting. Let's explain by complex example!

```yml
version: 1.0.0
tasks:
  build-files:
    script: 'yarn run build'
  start-docker:
    script: 'docker-compose -f ./dc/base.yml up -d'
    parallel: true
  start-dev:
    script: 'yarn run start'
    parallel: true
  build-deps:
    script: 'yarn run deps-build'

flows:
  local:
    tasks:
      - build-deps
      - build-files
      - start-docker
      - start-dev
    failure: 'node ./report-failure.js --local-broken'
    exit: 'node ./spindown-local.js'
```

When the `exit` script from the `local` flow is called there will be this available:

```js
const vortaProcesses = process.vorta;
console.log(JSON.stringify(vortaProcesses, null, 2))
```

Resulting in:

```sh
{
  'build-files': {
    taskId: 1,
    success: true,
    failure: false,
    exitCode: 0,
    stdio: [object Object]
  },
  'start-docker': {
    taskId: 2,
    success: true,
    failure: false,
    exitCode: 0,
    stdio: [object Object]
  },
  'start-dev': {
    taskId: 3,
    success: true,
    failure: false,
    exitCode: 0,
    stdio: [object Object]
  },
  'build-deps': {
    taskId: 4,
    success: true,
    failure: false,
    exitCode: 0,
    stdio: [object Object]
  },
}
```

### taskId

This is the process id. You can use it to forward signals.

### success/failure

Wether or not a step worked.

### exitCode

The exit code of each step.

### stdio

This is a collection of the streams we have open to the different sh shells. You can use this to read or send information!

> TODO: Build the features lmao!
