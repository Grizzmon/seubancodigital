const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
function transpile(path) { return ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText }
function load(path, deps, globals = {}) { const exports = {}; vm.runInNewContext(transpile(path), { exports, require: (id) => deps[id] || require(id), Date, URL, console, ...globals }); return exports }
const config = load('lib/push-config.ts', {})
const scheduled = load('lib/scheduled-push.ts', { './push-config': config })
const sub = { endpoint: 'https://fcm.googleapis.com/fcm/send/device', keys: { p256dh: 'A'.repeat(87), auth: 'B'.repeat(22) } }
function route(existing, authenticated) {
  let row = existing
  const createdAt = new Date().toISOString()
  const db = { from(table) {
    const query = { select() { return query }, eq() { return query }, async maybeSingle() {
      return { data: table === 'school_accounts' ? { bankpix_user_id: 'account', created_at: createdAt } : row }
    }, async upsert(update) { row = { ...row, ...update }; return { error: null } } }
    return query
  } }
  const handler = load('app/api/notification-device/route.ts', {
    'next/server': { NextResponse: { json: (body, init = {}) => ({ body, status: init.status || 200 }) } },
    'web-push': { default: { sendNotification: async () => {} } },
    '@/lib/push-server': { getServerSupabase: () => db, ensureVapid() {} },
    '@/lib/school-auth': { validSameOrigin: () => true, schoolIdentity: async () => ({ user: authenticated ? { id: 'auth' } : null }), setSchoolCookies: (response) => response },
    '@/lib/scheduled-push': scheduled,
  })
  return { row: () => row, post: (action) => handler.POST({ json: async () => ({ action, subscription: sub }) }) }
}
test('completed account cancels abandonment and creates five minute welcome', async () => {
  const start = Date.now()
  const api = route({ abandonment_due_at: new Date(start + 1800000).toISOString(), abandonment_sent_at: null }, true)
  assert.equal((await api.post('sync')).status, 200)
  assert.equal(api.row().user_id, 'account')
  assert.equal(api.row().abandonment_due_at, null)
  assert.ok(new Date(api.row().welcome_due_at).getTime() >= start + 299000)
  const original = api.row().welcome_due_at
  await api.post('sync')
  assert.equal(api.row().welcome_due_at, original)
})
test('anonymous exit queues reminder and returning cancels it', async () => {
  const api = route(null, false)
  await api.post('exit')
  assert.ok(api.row().abandonment_due_at)
  await api.post('sync')
  assert.equal(api.row().abandonment_due_at, null)
})
test('logging out does not turn a completed device into an incomplete registration', async () => {
  const api = route({ user_id: 'account', welcome_due_at: '2026-11-06T14:00:00Z' }, false)
  await api.post('exit')
  assert.equal(api.row().user_id, 'account')
  assert.equal(api.row().abandonment_due_at, null)
})

test('account sync creates day-one reminders and preserves their sent state', async () => {
  const api = route(null, true)
  const start = Date.now()
  await api.post('sync')
  assert.ok(Date.parse(api.row().day1_due_at) >= start + 86400000)
  assert.ok(Date.parse(api.row().day1followup_due_at) >= start + 100800000)
  const due = api.row().day1_due_at
  api.row().day1_sent_at = new Date().toISOString()
  await api.post('sync')
  assert.equal(api.row().day1_due_at, due)
  assert.ok(api.row().day1_sent_at)
})
