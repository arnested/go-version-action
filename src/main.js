import path from 'path'
import fs from 'fs'
import * as core from '@actions/core'
import {
  getGoModVersion,
  getVersions,
  gomod,
  latest,
  matrix,
  minimal,
  modulename
} from './go-versions.js'

export function validateWorkingDirectory(workingDirectory, workspace) {
  const resolvedDirectory = path.resolve(workspace, workingDirectory)
  if (
    resolvedDirectory !== workspace &&
    !resolvedDirectory.startsWith(workspace + path.sep)
  ) {
    throw new Error(
      'working-directory must resolve to a path inside the workspace'
    )
  }
  // Resolve symlinks to prevent symlink-based workspace escapes
  try {
    const realDirectory = fs.realpathSync(resolvedDirectory)
    const realWorkspace = fs.realpathSync(workspace)
    if (
      realDirectory !== realWorkspace &&
      !realDirectory.startsWith(realWorkspace + path.sep)
    ) {
      throw new Error(
        'working-directory must resolve to a path inside the workspace'
      )
    }
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e
    }
    // Directory does not exist yet; the downstream file read will handle it
  }
  return resolvedDirectory
}

async function run() {
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
    const withLatestPatches = core.getBooleanInput('latest-patches-only')
    const withStrictSemver = core.getBooleanInput('strict-semver')
    const workspace = path.resolve(process.env.GITHUB_WORKSPACE || process.cwd())
    const resolvedDirectory = validateWorkingDirectory(workingDirectory, workspace)
    const content = gomod(path.join(resolvedDirectory, 'go.mod'))
    const name = modulename(content)
    const goModVersion = getGoModVersion(content)
    const versions = await getVersions(withUnsupported)
    const mat = matrix(
      goModVersion,
      withUnstable,
      withPatchLevel,
      withLatestPatches,
      withStrictSemver,
      versions
    )
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
    core.setFailed(error.message)
  }
}

/* istanbul ignore next */
if (process.env.NODE_ENV !== 'test') {
  run()
}
