const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
function load(path, deps = {}) {
  const exports = {}
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    { exports, require: (id) => deps[id] || require(id), Date, URL })
  return exports
}
const config = load('lib/push-config.ts')
const { nextDeviceNotice, validBrowserSubscription } = load('lib/scheduled-push.ts', { './push-config': config })
const created = Date.parse('2026-11-06T10:00:00Z')
const at = (minutes) => new Date(created + minutes * 60000).toISOString()
const base = { id: 'device', user_id: null, welcome_due_at: null, welcome_sent_at: null,
  followup_due_at: null, followup_sent_at: null, abandonment_due_at: at(30), abandonment_sent_at: null }
test('abandoned registration waits thirty minutes and is not sent twice', () => {
  assert.equal(nextDeviceNotice(base, null, created + 29 * 60000), null)
  const notice = nextDeviceNotice(base, null, created + 30 * 60000)
  assert.equal(notice.kind, 'abandonment')
  assert.equal(JSON.parse(notice.payload).title, 'Cadastro não concluído!')
  assert.equal(nextDeviceNotice({ ...base, abandonment_sent_at: at(30) }, null, created + 60 * 60000), null)
})
test('completed account receives its own first name after five minutes', () => {
  const device = { ...base, user_id: 'account', welcome_due_at: at(5), followup_due_at: at(120) }
  assert.equal(nextDeviceNotice(device, 'Rubem Mendes', created + 4 * 60000), null)
  const welcome = nextDeviceNotice(device, 'Rubem Mendes', created + 5 * 60000)
  assert.equal(welcome.kind, 'welcome')
  assert.equal(JSON.parse(welcome.payload).title, 'Olá Rubem! 👋 sua conta está ativada✅')
  assert.equal(nextDeviceNotice({ ...device, welcome_sent_at: at(5), welcome_due_at: null }, 'Rubem Mendes', created + 119 * 60000), null)
  assert.equal(nextDeviceNotice({ ...device, welcome_sent_at: at(5), welcome_due_at: null }, 'Rubem Mendes', created + 120 * 60000).kind, 'followup')
})
test('account completion never sends an old abandoned-registration notice', () => {
  const device = { ...base, user_id: 'account', welcome_due_at: at(35) }
  assert.equal(nextDeviceNotice(device, 'Rubem', created + 30 * 60000), null)
})
test('only known HTTPS browser push providers are allowed', () => {
  const sub = { endpoint: 'https://fcm.googleapis.com/fcm/send/test', keys: { p256dh: 'A'.repeat(87), auth: 'B'.repeat(22) } }
  assert.equal(validBrowserSubscription(sub), true)
  assert.equal(validBrowserSubscription({ ...sub, endpoint: 'http://127.0.0.1' }), false)
  assert.equal(validBrowserSubscription({ ...sub, endpoint: 'https://fcm.googleapis.com:444/test' }), false)
})

test('day-one notices use the account name, wait 24h and send each stage once', () => {
  const device = { ...base, user_id: 'account', welcome_sent_at: at(5), followup_sent_at: at(120),
    day1_due_at: at(1440), day1_sent_at: null, day1followup_due_at: at(1680), day1followup_sent_at: null }
  assert.equal(nextDeviceNotice(device, 'Gimo Mendes', created + 1439 * 60000), null)
  const notice = nextDeviceNotice(device, 'Gimo Mendes', created + 1440 * 60000)
  assert.equal(notice.kind, 'day1')
  assert.equal(JSON.parse(notice.payload).title, 'Olá Gimo! 👋')
  assert.match(JSON.parse(notice.payload).body, /demonstração/)
  const firstSent = { ...device, day1_sent_at: at(1440), day1_due_at: null }
  assert.equal(nextDeviceNotice(firstSent, 'Gimo', created + 1679 * 60000), null)
  const later = nextDeviceNotice(firstSent, 'Gimo', created + 1680 * 60000)
  assert.equal(later.kind, 'day1followup')
  assert.match(JSON.parse(later.payload).body, /demonstração escolar/)
  assert.equal(nextDeviceNotice({ ...firstSent, day1followup_sent_at: at(1680) }, 'Gimo', created + 10000 * 60000), null)
  // Anonymous devices do not receive completed-account day-one notices.
  assert.equal(nextDeviceNotice({ ...device, user_id: null, abandonment_sent_at: at(30) }, null, created + 2000 * 60000), null)
  // A delayed first notice must not be followed immediately by the second.
  assert.equal(nextDeviceNotice({ ...firstSent, day1_sent_at: at(1700) }, 'Gimo', created + 1701 * 60000), null)
})
test('late permission starts at the opt-in time with no immediate backlog', () => {
  const { dayOneSchedule } = load('lib/scheduled-push.ts', { './push-config': config })
  const now = created + 72 * 60 * 60000
  const schedule = dayOneSchedule(at(0), now)
  assert.equal(Date.parse(schedule.day1_due_at), now + 24 * 60 * 60000)
  assert.equal(Date.parse(schedule.day1followup_due_at), now + 28 * 60 * 60000)
})
