import * as core from '@actions/core'
import {
  gomod,
  latest,
  minimal,
  matrix,
  modulename,
  getTags
} from './go-versions'

async function run(): Promise<void> {
  try {
    const workdir = core.getInput('working-directory')
    const content = gomod(`${workdir}/go.mod`)
    const name = modulename(content)
    const min = minimal(content)
    const t = await getTags()
    const mat = matrix(min, t)
    const lat = latest(mat)

    core.setOutput('module', name)
    core.setOutput('minimal', min)
    core.setOutput('matrix', mat)
    core.setOutput('latest', lat)
    core.info(`go module path: ${name} (from go.mod)`)
    core.info(`minimal go version: ${min} (from go.mod)`)
    core.info(`latest go version: ${lat} (from github.com/golang/go)`)
    core.info(`go version matrix: ${mat} (from github.com/golang/go)`)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
