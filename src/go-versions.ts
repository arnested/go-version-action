import fs from 'fs'
import semverCoerce from 'semver/functions/coerce'
import semverGte from 'semver/functions/gte'
import {Endpoints} from '@octokit/types'
import {Octokit} from '@octokit/rest'

export type listTags = Endpoints['GET /repos/{owner}/{repo}/tags']['response']['data']

const gomod = (path: string): string => {
  return fs.readFileSync(path, 'utf8')
}

const minimal = (content: string): string => {
  const r = /\ngo ([0-9\\.]*)\n/s

  const matches = r.exec(content)

  if (matches === null) {
    throw new Error('No go version in go.mod')
  }

  return matches[1]
}

const modulename = (content: string): string => {
  const r = /module ([^\n]*)\n/s

  const matches = r.exec(content)

  if (matches === null) {
    throw new Error('No module name in go.mod')
  }

  return matches[1]
}

const getTags = async (): Promise<listTags> => {
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  })

  return await octokit.paginate(octokit.repos.listTags, {
    owner: 'golang',
    repo: 'go'
  })
}

const matrix = (min: string, tags: listTags): string[] => {
  const minClean = semverCoerce(min)
  if (minClean === null) {
    throw new Error(`Minimal version isn't quite right: ${min}`)
  }

  const releaseTags = tags.filter(tag => tag.name.match(/^go[0-9]+\.[0-9]+$/))

  const releaseVersions = releaseTags.map(tag => tag.name.substr(2))

  const versions = releaseVersions.filter(v => {
    const v2 = semverCoerce(v)
    return v2 !== null && semverGte(v2, minClean)
  })

  return versions
}

const latest = (versions: string[]): string => {
  return versions.reduce((acc, val) => {
    const a = semverCoerce(acc)
    const v = semverCoerce(val)

    if (v !== null && a !== null && semverGte(v, a)) {
      return val
    }

    return acc
  })
}

export {gomod, latest, matrix, minimal, modulename, getTags}
