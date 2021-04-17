import { exec } from "child_process"
import { ExecException } from "node:child_process"
import { VortaConfig, VortaTask } from "../yaml"

type TaskMap = Record<string, VortaTask>

export interface TaskRun {
  name: string
  task: VortaTask
}

export interface ExecResult {
  stderr: string
  stdout: string
  err: ExecException | null
  task?: string
}

const pickFlowFromYaml = (flow: string, yaml: VortaConfig[]) => {
  return yaml.find((yamlette) => yamlette.flows[flow])
}

const pickTasksFromYaml = (tasks: string[], yaml: VortaConfig[]) => {
  return yaml
    .filter((yamlette) => {
      return Object.keys(yamlette?.tasks || {}).some((key) =>
        tasks.includes(key)
      )
    })
    .reduce((acc, cur) => {
      for (const task of tasks) {
        if (cur.tasks[task]) acc[task] = cur.tasks[task]
      }
      return acc
    }, {} as TaskMap)
}

const groupByExecution = (taskMap: TaskMap, tasks: string[]) => {
  const flowSteps = [] as TaskRun[][]
  for (const task of tasks) {
    const currentTask = taskMap[task]
    const lastFlow = flowSteps.pop()
    if (!lastFlow) flowSteps.push([{ name: task, task: currentTask }])
    else if (currentTask.parallel && lastFlow[0].task.parallel) {
      lastFlow.push({ name: task, task: currentTask })
    } else {
      flowSteps.push(lastFlow)
      flowSteps.push([{ name: task, task: currentTask }])
    }
  }
  return flowSteps
}

const execButNice = (cmd: string): Promise<ExecResult> =>
  new Promise((res) => {
    exec(cmd, { env: process.env }, (err, stdout, stderr) => {
      res({ stderr, stdout, err })
    })
  })

const runSingleTask = async (task: TaskRun): Promise<ExecResult> => {
  const run = await execButNice(task.task.script)
  if (run.err) {
    if (task.task.failure) await execButNice(task.task.failure)
  } else {
    if (task.task.success) await execButNice(task.task.success)
  }
  return { ...run, task: task.name }
}

const executeSteps = async (taskBlock: TaskRun[]) => {
  const isParallel = taskBlock[0].task.parallel
  let output = []
  if (isParallel) {
    output = await Promise.all(
      taskBlock.map((task) => {
        return runSingleTask(task)
      })
    )
  } else {
    const result = await runSingleTask(taskBlock[0])
    output.push(result)
  }
  return output
}

const reportTaskRun = (flow: string, results: ExecResult[]) => {
  const itWorked = results.every((result) => !result.err)
  let exitCode = 0
  if (itWorked) {
    console.log(`[vorta-success]: ran flow ${flow} without issue!`)
  } else {
    console.error(`[vorta-failure]: ran flow ${flow}, failures occurred.`)
    exitCode = 1
  }
  results.forEach((result) => {
    console.warn(`[vorta-task]: ${result.task}`)
    console.log(`[vorta-task-stdout]: `, result.stdout)
    if (result.err) {
      console.error(`[vorta-task-stderr]: `, result.stderr)
      console.warn(`[vorta-task-err]: `, result.err)
    }
  })
  results.forEach((result) => {
    console.warn(
      `[vorta-final]: ${result.task} ${result.err ? "failed" : "succeeded"}`
    )
  })
  process.exit(exitCode)
}

export const runAFlow = async (
  flow: string,
  yaml: VortaConfig[]
): Promise<void | null> => {
  const foundJem = pickFlowFromYaml(flow, yaml)
  if (!foundJem) return null
  const foundFlow = foundJem.flows[flow]
  const foundTasks = pickTasksFromYaml(foundFlow.tasks, yaml)
  const runSteps = groupByExecution(foundTasks, foundFlow.tasks)
  const runResults = []
  for (const step of runSteps) {
    const singleResult = await executeSteps(step)
    runResults.push(...singleResult)
  }
  reportTaskRun(flow, runResults)
}
