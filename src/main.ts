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

    const htmlMat = mat
      .map(v => `<a href="https://go.dev/doc/go${v}">Go ${v}</a>`)
      .join('<br>')

    await core.summary
      .addTable([
        [
          {data: 'Output', header: true},
          {data: 'Value', header: true}
        ],
        ['Module', `<a href="https://pkg.go.dev/${name}">${name}</a>`],
        ['Minimal', `<a href="https://go.dev/doc/go${min}">Go ${min}</a>`],
        ['Latest', `<a href="https://go.dev/doc/go${lat}">Go ${lat}</a>`],
        ['Matrix', `${htmlMat}`]
      ])
      .write()
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

run()
