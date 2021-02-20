import {
  gomod,
  latest,
  minimal,
  matrix,
  modulename,
  getTags
} from '../src/go-versions'
import fs from 'fs'

test('test module name', () => {
  const content = gomod('__tests__/testdata/go.mod')
  expect(modulename(content)).toEqual('example.com/go/testmodule')
})

test('test minimal version', () => {
  const content = gomod('__tests__/testdata/go.mod')
  expect(minimal(content)).toEqual('1.13')
})

test('test latest version', () => {
  expect(latest(['1.16', '1.15', '1.14', '1.13'])).toEqual('1.16')
})

test('test version matrix', () => {
  const t = JSON.parse(
    fs.readFileSync('__tests__/testdata/listTags.json', 'utf8')
  )
  const m = matrix('1.13', t)
  expect(m).toEqual(['1.16', '1.15', '1.14', '1.13'])
})
