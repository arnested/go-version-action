import fs from 'fs'
import {gomod, latest, matrix, minimal, modulename} from '../src/go-versions'

test('test module name', () => {
  const content = gomod('__tests__/testdata/go.mod')
  expect(modulename(content)).toEqual('example.com/go/testmodule')
})

test('test minimal version', () => {
  const content = gomod('__tests__/testdata/go.mod')
  expect(minimal(content)).toEqual('1.13')
})

test('test latest version', () => {
  expect(latest(['1.18', '1.17', '1.16', '1.15', '1.14', '1.13'])).toEqual(
    '1.18'
  )
})

test('test version matrix', () => {
  const t = JSON.parse(fs.readFileSync('__tests__/testdata/dl.json', 'utf8'))
  const m = matrix('1.13', t)
  expect(m).toEqual(['1.18', '1.17', '1.16', '1.15', '1.14', '1.13'])
})
