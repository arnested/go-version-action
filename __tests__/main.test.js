import fs from 'fs'
import {
  getGoModVersion,
  gomod,
  latest,
  matrix,
  minimal,
  modulename
} from '../src/go-versions.js'

test('test module name', () => {
  const content = gomod('__tests__/testdata/go.mod')
  expect(modulename(content)).toEqual('example.com/go/testmodule')
})

test('test go mod version', () => {
  const content = gomod('__tests__/testdata/go.mod')
  expect(getGoModVersion(content)).toEqual('1.16')
})

test('test minimal version', () => {
  expect(minimal(['1.16', '1.17', '1.18'])).toEqual('1.16')
})

test('test latest version', () => {
  expect(latest(['1.16', '1.17', '1.18'])).toEqual('1.18')
})

test('test version matrix', () => {
  const t = JSON.parse(fs.readFileSync('__tests__/testdata/dl.json', 'utf8'))
  const m = matrix('1.16', false, false, false, false, t)
  expect(m).toEqual(['1.16', '1.17', '1.18'])
})

test('test unstable version matrix', () => {
  const t = JSON.parse(fs.readFileSync('__tests__/testdata/dl.json', 'utf8'))
  const m = matrix('1.16', true, false, false, false, t)
  expect(m).toEqual([
    '1.16beta1',
    '1.16rc1',
    '1.16',
    '1.17beta1',
    '1.17rc1',
    '1.17rc2',
    '1.17',
    '1.18beta1',
    '1.18beta2',
    '1.18rc1',
    '1.18'
  ])
})

test('test patch level version matrix', () => {
  const t = JSON.parse(fs.readFileSync('__tests__/testdata/dl.json', 'utf8'))
  const m = matrix('1.16', false, true, false, false, t)
  expect(m).toEqual([
    '1.16',
    '1.16.1',
    '1.16.2',
    '1.16.3',
    '1.16.4',
    '1.16.5',
    '1.16.6',
    '1.16.7',
    '1.16.8',
    '1.16.9',
    '1.16.10',
    '1.16.11',
    '1.16.12',
    '1.16.13',
    '1.16.14',
    '1.16.15',
    '1.17',
    '1.17.1',
    '1.17.2',
    '1.17.3',
    '1.17.4',
    '1.17.5',
    '1.17.6',
    '1.17.7',
    '1.17.8',
    '1.18'
  ])
})

test('test patch level, unstable version matrix', () => {
  const t = JSON.parse(fs.readFileSync('__tests__/testdata/dl.json', 'utf8'))
  const m = matrix('1.16', true, true, false, false, t)
  expect(m).toEqual([
    '1.16beta1',
    '1.16rc1',
    '1.16',
    '1.16.1',
    '1.16.2',
    '1.16.3',
    '1.16.4',
    '1.16.5',
    '1.16.6',
    '1.16.7',
    '1.16.8',
    '1.16.9',
    '1.16.10',
    '1.16.11',
    '1.16.12',
    '1.16.13',
    '1.16.14',
    '1.16.15',
    '1.17beta1',
    '1.17rc1',
    '1.17rc2',
    '1.17',
    '1.17.1',
    '1.17.2',
    '1.17.3',
    '1.17.4',
    '1.17.5',
    '1.17.6',
    '1.17.7',
    '1.17.8',
    '1.18beta1',
    '1.18beta2',
    '1.18rc1',
    '1.18'
  ])
})

test('test patch level, unstable, semver clean version matrix', () => {
  const t = JSON.parse(fs.readFileSync('__tests__/testdata/dl.json', 'utf8'))
  const m = matrix('1.16', true, true, false, true, t)
  expect(m).toEqual([
    '1.16.0-beta.1',
    '1.16.0-rc.1',
    '1.16.0',
    '1.16.1',
    '1.16.2',
    '1.16.3',
    '1.16.4',
    '1.16.5',
    '1.16.6',
    '1.16.7',
    '1.16.8',
    '1.16.9',
    '1.16.10',
    '1.16.11',
    '1.16.12',
    '1.16.13',
    '1.16.14',
    '1.16.15',
    '1.17.0-beta.1',
    '1.17.0-rc.1',
    '1.17.0-rc.2',
    '1.17.0',
    '1.17.1',
    '1.17.2',
    '1.17.3',
    '1.17.4',
    '1.17.5',
    '1.17.6',
    '1.17.7',
    '1.17.8',
    '1.18.0-beta.1',
    '1.18.0-beta.2',
    '1.18.0-rc.1',
    '1.18.0'
  ])
})

test('test patch level with latest patches only', () => {
  const t = JSON.parse(fs.readFileSync('__tests__/testdata/dl.json', 'utf8'))
  const m = matrix('1.16', false, true, true, false, t)
  expect(m).toEqual(['1.16.15', '1.17.8', '1.18'])
})

test('test patch level with latest patches only and unstable throws error', () => {
  const t = JSON.parse(fs.readFileSync('__tests__/testdata/dl.json', 'utf8'))
  expect(() => {
    matrix('1.16', true, true, true, false, t)
  }).toThrow(
    'The options "unstable" and "latest-patches-only" cannot be used together'
  )
})
