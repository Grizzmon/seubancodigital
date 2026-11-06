const { test } = require('node:test')
const assert = require('node:assert/strict')
const ts = require('typescript')
const fs = require('node:fs')
const vm = require('node:vm')
function handler() {
  let sends = 0
  const row = { id: 'device', test_sent_at: '2026-10-30T00:00:00Z' }
  const query = {
    select() { return this }, eq() { return this },
    upsert() { return this }, update() { return this },
    async maybeSingle() { return { data: row } },
    async single() { return { data: row } },
    then(resolve) { return Promise.resolve({ error: null }).then(resolve) },
  }
  const dependencies = {
    'next/server': { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) } },
    'web-push': { default: { sendNotification: async () => { sends++ } } },
    '@/lib/push-server': { ensureVapid() {}, getServerSupabase: () => ({ from: () => query }) },
  }
  const exports = {}
  const code = ts.transpileModule(fs.readFileSync('app/api/launch-notifications/route.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  vm.runInNewContext(code, { exports, require: (id) => dependencies[id], URL, Date, console,
    process: { env: { SUPABASE_SERVICE_ROLE_KEY: 'test-only' } } })
  return { post: exports.POST, sends: () => sends }
}
function request(test) {
  return { url: 'https://example.com/api/launch-notifications', headers: { get: () => 'https://example.com' },
    json: async () => ({ test, subscription: { endpoint: 'https://fcm.googleapis.com/fcm/send/test',
      keys: { p256dh: 'A'.repeat(87), auth: 'B'.repeat(22) } } }) }
}
test('explicit test sends again for a previously confirmed device', async () => {
  const h = handler()
  const result = await h.post(request(true))
  assert.equal(result.status, 200)
  assert.equal(result.body.testSent, true)
  assert.equal(h.sends(), 1)
})
test('background registration does not resend tests for confirmed devices', async () => {
  const h = handler()
  const result = await h.post(request(false))
  assert.equal(result.body.alreadyTested, true)
  assert.equal(h.sends(), 0)
})
