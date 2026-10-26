const { test } = require('node:test')
const assert = require('node:assert/strict')
const ts = require('typescript')
const fs = require('node:fs')
const vm = require('node:vm')
function load(path, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, require: (id) => dependencies[id] ?? require(id), Date, console, Buffer, process })
  return exports
}
const config = load('lib/push-config.ts')
function database() {
  let lastSent = null
  return {
    get lastSent() { return lastSent },
    from(table) {
      let update, expected, onlyNull = false
      const query = {
        select() { return query },
        eq(field, value) { if (field === 'last_remarketing_sent_at') expected = value; return query },
        is() { onlyNull = true; return query },
        update(value) { update = value; return query },
        async maybeSingle() { return { data: { id: 'user', name: 'gimo Mendes', access_type: 'FREE', last_remarketing_sent_at: lastSent } } },
        then(resolve) {
          if (table === 'push_subscriptions') return Promise.resolve({ data: [{ id: 1, endpoint: 'endpoint', p256dh: 'key', auth: 'auth' }] }).then(resolve)
          if (update) {
            const accepted = (!onlyNull || lastSent === null) && (expected === undefined || expected === lastSent)
            if (accepted) lastSent = update.last_remarketing_sent_at
            return Promise.resolve({ data: accepted ? [{ id: 'user' }] : [] }).then(resolve)
          }
          throw new Error('Unexpected database call')
        },
      }
      return query
    },
  }
}
test('personalized welcome, no uppercase name, same request for FREE and VIP', () => {
  for (const access of ['FREE', 'VIP']) {
    const payload = JSON.parse(config.buildWelcomePushPayload(' gimo Mendes ', access))
    assert.equal(payload.body, 'Olá! 🥳❤️ Gimo, sua conta está pronta! Cadastre sua chave Pix e comece a receber o seu dinheiro.')
    assert.equal(payload.tag, 'realpayz-welcome')
  }
  assert.equal(config.WELCOME_PUSH_MODE, 'delayed')
})
test('concurrent exit beacons send only one welcome', async () => {
  let sends = 0
  const { sendWelcomePush } = load('lib/welcome-push.ts', {
    './push-config': config,
    './push-server': { sendToSubscriptions: async () => { sends++; return { enviadas: 1 } } },
  })
  const db = database()
  const outcomes = await Promise.all([sendWelcomePush(db, 'user'), sendWelcomePush(db, 'user')])
  assert.equal(sends, 1)
  assert.equal(outcomes.filter((value) => value.status === 'sent').length, 1)
  assert.ok(db.lastSent)
})
test('failed push releases claim so next attempt can succeed', async () => {
  let fail = true
  const { sendWelcomePush } = load('lib/welcome-push.ts', {
    './push-config': config,
    './push-server': { sendToSubscriptions: async () => { if (fail) throw new Error('VAPID failure'); return { enviadas: 1 } } },
  })
  const db = database()
  assert.equal((await sendWelcomePush(db, 'user')).status, 'error')
  assert.equal(db.lastSent, null)
  fail = false
  assert.equal((await sendWelcomePush(db, 'user')).status, 'sent')
})
test('no accepted endpoints does not mark welcome as sent', async () => {
  const { sendWelcomePush } = load('lib/welcome-push.ts', {
    './push-config': config,
    './push-server': { sendToSubscriptions: async () => ({ enviadas: 0 }) },
  })
  const db = database()
  assert.equal((await sendWelcomePush(db, 'user')).status, 'error')
  assert.equal(db.lastSent, null)
})
