const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
function load(file, dependencies = {}) {
  const exports = {}
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  vm.runInNewContext(code, { exports, require: (id) => Object.hasOwn(dependencies, id) ? dependencies[id] : require(id),
    console, process, URL, AbortSignal })
  return exports
}
const json = (body, init = {}) => ({ body, status: init.status ?? 200 })
test('maintenance screen presents unavailability and an explicit opt-in button', () => {
  const { MaintenanceScreen } = load('components/maintenance-screen.tsx', {
    'next/image': { default: ({ priority, ...props }) => React.createElement('img', props) },
  })
  const html = renderToStaticMarkup(React.createElement(MaintenanceScreen))
  assert.match(html, /Estamos a/); assert.match(html, /preparar tudo/)
  assert.match(html, /temporariamente indisponível/)
  assert.match(html, /Ativar notificação/)
  assert.doesNotMatch(html, /Criar conta|Sua conta está pronta/)
})
for (const [file, method] of [['register-user', 'POST'], ['welcome-push', 'POST'], ['remarketing-cron', 'GET']]) {
  test(`${file} stops processing while maintenance is enabled`, async () => {
    const module = load(`app/api/${file}/route.ts`, {
      '@/lib/site-status': { SITE_UNDER_CONSTRUCTION: true },
      'next/server': { NextResponse: { json } },
      '@/lib/push-server': { getServerSupabase() { throw new Error('Must not contact database') } },
      '@/lib/welcome-push': {}, '@/lib/launch-notifications': {}, '@/lib/push-config': {},
    })
    const response = await module[method]({})
    assert.equal(response.status, 503)
    assert.equal(response.body.unavailable, true)
  })
}
test('launch request never returns a confirmation if its database write fails', async () => {
  const { POST } = load('app/api/launch-notifications/route.ts', {
    'next/server': { NextResponse: { json } },
    '@/lib/push-server': { getServerSupabase: () => ({ from: () => ({ upsert: () => ({ abortSignal: async () => ({ error: { message: 'Database offline' } }) }) }) }) },
  })
  const previous = process.env.SUPABASE_SERVICE_ROLE_KEY
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only'
  try {
    const response = await POST({ url: 'https://example.com/api/launch-notifications', headers: { get: () => 'https://example.com' },
      json: async () => ({ subscription: { endpoint: 'https://fcm.googleapis.com/test', keys: { p256dh: 'a'.repeat(87), auth: 'b'.repeat(22) } } }) })
    assert.equal(response.status, 503)
    assert.notEqual(response.body.success, true)
  } finally {
    if (previous === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previous
  }
})
