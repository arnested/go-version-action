import fs from 'fs'
import fetch from 'node-fetch'
import semverCoerce from 'semver/functions/coerce.js'
import semverGte from 'semver/functions/gte.js'
import semverLte from 'semver/functions/lte.js'

const gomod = path => {
  return fs.readFileSync(path, 'utf8')
}

const getGoModVersion = content => {
  const r = /\ngo ([^\n]*)\n/s
  const matches = r.exec(content)
  if (matches === null) {
    throw new Error('No go version in go.mod')
  }
  return matches[1]
}

const modulename = content => {
  const r = /module ([^\n]*)\n/s
  const matches = r.exec(content)
  if (matches === null) {
    throw new Error('No module path in go.mod')
  }
  return matches[1]
}

const getVersions = async withUnsupported => {
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
  const result = await response.json()
  return result
}

const matrix = (min, withUnstable, withPatchLevel, withLatestPatches, tags) => {
  const minClean = semverCoerce(min)
  if (minClean === null) {
    throw new Error(`Minimal version isn't quite right: ${min}`)
  }
  if (withUnstable && withLatestPatches) {
    throw new Error(
      'The options "unstable" and "latest-patches-only" cannot be used together'
    )
  }
  if (!withUnstable) {
    tags = tags.filter(tag => tag.stable === true)
  }
  const r = /^go(.*)$/
  let versions = tags.map(tag => {
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
  } else if (withLatestPatches) {
    // Group by major.minor and keep only the latest patch version
    const grouped = {}
    versions.forEach(version => {
      const parts = version.split('.')
      const majorMinor = `${parts[0]}.${parts[1]}`
      if (!grouped[majorMinor]) {
        grouped[majorMinor] = []
      }
      grouped[majorMinor].push(version)
    })
    versions = Object.values(grouped).map(group => {
      return group.reduce((acc, val) => {
        const a = semverCoerce(acc)
        const v = semverCoerce(val)
        if (v !== null && a !== null && semverGte(v, a)) {
          return val
        }
        return acc
      })
    })
  }
  versions = [...new Set(versions)]
  return versions.reverse()
}

const latest = versions => {
  return versions.reduce((acc, val) => {
    const a = semverCoerce(acc)
    const v = semverCoerce(val)
    if (v !== null && a !== null && semverGte(v, a)) {
      return val
    }
    return acc
  })
}

const minimal = versions => {
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
