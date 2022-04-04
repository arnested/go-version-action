import * as core from '@actions/core'
import {
  getVersions,
  gomod,
  latest,
  matrix,
  minimal,
  modulename
} from './go-versions'

async function run(): Promise<void> {
  try {
    if (process.env.GITHUB_TOKEN !== undefined) {
      core.warning(
        'arnested/go-version-action no longer needs a GITHUB_TOKEN. You should remove it.'
      )
    }

    const workdir = core.getInput('working-directory')
    const content = gomod(`${workdir}/go.mod`)
    const name = modulename(content)
    const min = minimal(content)
    const versions = await getVersions()
    const mat = matrix(min, versions)
    const lat = latest(mat)

    core.setOutput('module', name)
    core.setOutput('minimal', min)
    core.setOutput('matrix', mat)
    core.setOutput('latest', lat)
    core.info(`go module path: ${name} - from go.mod`)
    core.info(`minimal go version: ${min} - from go.mod`)
    core.info(`latest go version: ${lat} - from https://go.dev/dl/`)
    core.info(`go version matrix: ${mat} - from https://go.dev/dl/`)
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

run()
