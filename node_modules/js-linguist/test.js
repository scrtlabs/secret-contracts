import test from 'ava'
import fn from './'
import parse from './parse'

test('addLanguageBadges returns linguist output from this repo', t => {
  fn((data) => {
    t.deepEqual(data, { 'JavaScript': '100' })
  })
})

test('parse.trimLinguistOutput works with one return', t => {
  t.deepEqual(parse.trimLinguistOutput('100% JavaScript\n'), {
    'JavaScript': '100'
  })
})

test('parse.trimLinguistOutput works with multiple', t => {
  t.deepEqual(parse.trimLinguistOutput(`83.35%  Go
15.57%  Shell
0.83%   Makefile
0.19%   Protocol Buffer
0.05%   Python
0.00%   PureBasic`), {
  Go: '83.35',
  Shell: '15.57',
  Makefile: '0.83',
  'Protocol Buffer': '0.19',
  Python: '0.05',
  PureBasic: '0.00'
})
})
