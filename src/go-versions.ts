import fs from 'fs'
import fetch from 'node-fetch'
import semverCoerce from 'semver/functions/coerce'
import semverGte from 'semver/functions/gte'

interface Version {
  version: string
}

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
    throw new Error('No module path in go.mod')
  }

  return matches[1]
}

const getVersions = async (): Promise<Version[]> => {
  const response = await fetch('https://go.dev/dl/?mode=json&include=all')

  if (!response.ok) {
    throw new Error(
      `Could not fetch Go versions from https://go.dev/dl/: ${response.status}`
    )
  }

  const result = (await response.json()) as Version[]

  return result
}

const matrix = (min: string, tags: Version[]): string[] => {
  const minClean = semverCoerce(min)
  if (minClean === null) {
    throw new Error(`Minimal version isn't quite right: ${min}`)
  }

  const releaseTags = tags.filter(tag =>
    tag.version.match(/^go[0-9]+\.[0-9]+$/)
  )

  const releaseVersions = releaseTags.map(tag => tag.version.substr(2))

  const versions = releaseVersions.filter(v => {
    const v2 = semverCoerce(v)
    return v2 !== null && semverGte(v2, minClean)
  })

  return versions.reverse()
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

export {gomod, latest, matrix, minimal, modulename, getVersions}
