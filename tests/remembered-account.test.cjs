const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
function setup() {
  const entries = new Map()
  const localStorage = { getItem: (k) => entries.get(k) ?? null, setItem: (k, v) => entries.set(k, v),
    removeItem: (k) => entries.delete(k), key: (i) => [...entries.keys()][i] ?? null,
    get length() { return entries.size } }
  const exports = {}
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/stored-user.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { exports, window: {}, localStorage })
  return { ...exports, localStorage }
}
const user = { name: 'Rubem Mendes', phone: '841234567', password: '123456', balance: 0, income: 0, keys: [], transactions: [] }
test('logout preserves account identity without reopening an authenticated session', () => {
  const app = setup()
  app.saveStoredUser(user)
  app.localStorage.setItem('realpayz_session_phone', user.phone)
  app.localStorage.removeItem('realpayz_session_phone')
  assert.equal(app.loadRememberedUser().name, 'Rubem Mendes')
  assert.equal(app.localStorage.getItem('realpayz_session_phone'), null)
})
test('a single account saved by an older version is recovered', () => {
  const app = setup()
  app.localStorage.setItem('bankpix_user_' + user.phone, JSON.stringify(user))
  app.localStorage.setItem('bankpix_user_id', 'server-uuid')
  assert.equal(app.loadRememberedUser().name, user.name)
})
test('multiple legacy accounts are not assigned to the wrong person', () => {
  const app = setup()
  app.localStorage.setItem('bankpix_user_' + user.phone, JSON.stringify(user))
  app.localStorage.setItem('bankpix_user_851234567', JSON.stringify({ ...user, name: 'Outra pessoa', phone: '851234567' }))
  assert.equal(app.loadRememberedUser(), null)
})
