import * as core from '@actions/core'
import {
  getVersions,
  gomod,
  latest,
  matrix,
  minimal,
  modulename,
  getGoModVersion
} from './go-versions'

async function run(): Promise<void> {
  try {
    if (process.env.GITHUB_TOKEN !== undefined) {
      core.warning(
        'arnested/go-version-action no longer needs a GITHUB_TOKEN. You should remove it.'
      )
    }

    const workingDirectory = core.getInput('working-directory')
    const withUnsupported = core.getBooleanInput('unsupported')
    const withUnstable = core.getBooleanInput('unstable')
    const withPatchLevel = core.getBooleanInput('patch-level')
    const content = gomod(`${workingDirectory}/go.mod`)
    const name = modulename(content)
    const goModVersion = getGoModVersion(content)
    const versions = await getVersions(withUnsupported)
    const mat = matrix(goModVersion, withUnstable, withPatchLevel, versions)
    const lat = latest(mat)
    const min = minimal(mat)

    core.setOutput('module', name)
    core.setOutput('go-mod-version', goModVersion)
    core.setOutput('minimal', min)
    core.setOutput('matrix', mat)
    core.setOutput('latest', lat)
    core.info(`go module path: ${name}`)
    core.info(`go mod version: ${goModVersion}`)
    core.info(`minimal go version: ${min}`)
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
        ['module', `<a href="https://pkg.go.dev/${name}">${name}</a>`],
        [
          'go.mod version',
          `<a href="https://go.dev/doc/go${goModVersion}">Go ${goModVersion}</a>`
        ],
        ['minimal', `<a href="https://go.dev/doc/go${min}">Go ${min}</a>`],
        ['latest', `<a href="https://go.dev/doc/go${lat}">Go ${lat}</a>`],
        ['matrix', `${htmlMat}`]
      ])
      .write()
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

run()
