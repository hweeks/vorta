import { execSync } from "../core-utils";
import { VortaConfig, VortaTask } from "../yaml/parse";

type TaskMap = Record<string, VortaTask>

export interface TaskRun {name: string, task: VortaTask}

const pickFlowFromYaml = (flow: string, yaml: VortaConfig[]) => {
  return yaml.find(yamlette => yamlette.flows[flow])
}

const pickTasksFromYaml = (tasks: string[], yaml: VortaConfig[]) => {
  return yaml.filter((yamlette) => {
    return Object.keys(yamlette?.tasks || {}).some(key => tasks.includes(key))
  }).reduce((acc, cur) => {
    for (const task of tasks) {
      if (cur.tasks[task]) acc[task] = cur.tasks[task]
    }
    return acc;
  }, {} as TaskMap)
}

const groupByExecution = (taskMap: TaskMap, tasks: string[]) => {
  const flowSteps = [] as TaskRun[][];
  for (const task of tasks) {
    const currentTask = taskMap[task];
    const lastFlow = flowSteps.pop()
    if (!lastFlow) flowSteps.push([{name: task, task: currentTask}])
    else if (currentTask.parallel && lastFlow[0].task.parallel) {
      lastFlow.push({name: task, task: currentTask})
    } else {
      flowSteps.push(lastFlow);
      flowSteps.push([{name: task, task: currentTask}])
    }
  }
  return flowSteps;
}

const runSingleTask = async (task: TaskRun) => {
  let outputStatus = true
  try {
    await execSync(task.task.script, {
      env: process.env,
    })
  } catch (e) {
    outputStatus = false
    console.warn(`[vorta-failure] task: ${task.name} failed!`)
    console.warn(e.message)
  }
  return outputStatus
}

const executeSteps = async (taskBlock: TaskRun[]) => {
  const isParallel = taskBlock[0].task.parallel
  let output = []
  if (isParallel) {
    output = await Promise.all(taskBlock.map(task => {
      return runSingleTask(task)
    }))
  } else {
    const result = await runSingleTask(taskBlock[0])
    output.push(result)
  }
  return output
}

export const runAFlow = async (flow: string, yaml: VortaConfig[]) : Promise<void | null> => {
  const foundJem = pickFlowFromYaml(flow, yaml)
  if (!foundJem) return null;
  const foundFlow = foundJem.flows[flow]
  const foundTasks = pickTasksFromYaml(foundFlow.tasks, yaml);
  const runSteps = groupByExecution(foundTasks, foundFlow.tasks)
  const runResults = []
  for (const step of runSteps) {
    const singleResult = await executeSteps(step)
    runResults.push(...singleResult)
  }
  const itWorked = runResults.every(Boolean)
  if (itWorked) {
    console.log(`[vorta-success]: ran flow ${flow} without issue!`)
    process.exit(0)
  } else {
    console.error(`[vorta-failure]: ran flow ${flow}, failure occurred. Please see prior output!`)
    process.exit(1);
  }
}
