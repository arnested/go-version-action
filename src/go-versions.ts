import fs from 'fs'
import fetch from 'node-fetch'
import semverCoerce from 'semver/functions/coerce'
import semverGte from 'semver/functions/gte'
import semverLte from 'semver/functions/lte'

interface Version {
  stable: boolean
  version: string
}

const gomod = (path: string): string => {
  return fs.readFileSync(path, 'utf8')
}

const getGoModVersion = (content: string): string => {
  const r = /\ngo ([^\n]*)\n/s

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

const getVersions = async (withUnsupported: boolean): Promise<Version[]> => {
  let url = 'https://go.dev/dl/?mode=json'

  if (withUnsupported) {
    url += '&include=all'
  }

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(
      `Could not fetch Go versions from https://go.dev/dl/: ${response.status}`
    )
  }

  const result = (await response.json()) as Version[]

  return result
}

const matrix = (
  min: string,
  withUnstable: boolean,
  withPatchLevel: boolean,
  tags: Version[]
): string[] => {
  const minClean = semverCoerce(min)
  if (minClean === null) {
    throw new Error(`Minimal version isn't quite right: ${min}`)
  }

  if (!withUnstable) {
    tags = tags.filter(tag => tag.stable === true)
  }

  const r = /^go(.*)$/

  let versions: string[] = tags.map(tag => {
    const matches = r.exec(tag.version)

    return matches ? matches[1] : tag.version
  })

  versions = versions.filter(v => {
    const v2 = semverCoerce(v)
    return v2 !== null && semverGte(v2, minClean)
  })

  if (!withPatchLevel) {
    versions = versions.map(version => {
      const parts = version.split('.')
      return `${parts[0]}.${parts[1]}`
    })
  }

  versions = [...new Set(versions)]

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

const minimal = (versions: string[]): string => {
  return versions.reduce((acc, val) => {
    const a = semverCoerce(acc)
    const v = semverCoerce(val)

    if (v !== null && a !== null && semverLte(v, a)) {
      return val
    }

    return acc
  })
}

export {
  gomod,
  latest,
  matrix,
  minimal,
  modulename,
  getGoModVersion,
  getVersions
}
