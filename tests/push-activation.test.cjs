const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const jsx = require('react/jsx-runtime')

test('activation after permission grant registers the device and requests confirmation in one click', async () => {
  const states = [], effects = [], calls = []
  let cursor = 0, mounting = true
  const hooks = {
    useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], (v) => { states[i] = v }] },
    useRef(initial) { const i = cursor++; if (!(i in states)) states[i] = { current: initial }; return states[i] },
    useEffect(fn) { if (mounting) effects.push(fn) },
  }
  const records = new Map()
  const localStorage = { getItem: (k) => records.get(k) ?? null, setItem: (k,v) => records.set(k,v) }
  const notification = { permission: 'default', async requestPermission() { notification.permission = 'granted'; return 'granted' } }
  const subscription = { options: {}, endpoint: 'https://fcm.googleapis.com/test', toJSON() { return { endpoint: this.endpoint, keys: { p256dh: 'key', auth: 'auth' } } } }
  const registration = { update: async () => {}, pushManager: { getSubscription: async () => subscription } }
  const window = { PushManager: {}, Notification: notification, addEventListener() {}, removeEventListener() {} }
  const document = { addEventListener() {}, removeEventListener() {} }
  const navigator = { userAgent: 'Android', platform: 'Linux', maxTouchPoints: 1,
    serviceWorker: { ready: Promise.resolve(registration), register: async () => registration } }
  async function fetch(url, options) {
    calls.push({ url, body: options?.body ? JSON.parse(options.body) : null })
    const result = url === '/api/register-user' ? { userId: 'real-user' }
      : url.startsWith('/api/push-config') ? { configured: true, publicKey: 'AQ' }
      : { success: true }
    return { ok: true, json: async () => result }
  }
  const exports = {}
  const deps = { react: hooks, 'react/jsx-runtime': jsx,
    '@/lib/stored-user': { loadRememberedUser: () => ({ name: 'Rubem Mendes', phone: '841234567' }) } }
  const code = ts.transpileModule(fs.readFileSync('components/service-worker-register.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  vm.runInNewContext(code, { exports, require: (id) => deps[id], localStorage, window, document, navigator,
    Notification: notification, matchMedia: () => ({ matches: false }), fetch, Uint8Array,
    atob: (s) => Buffer.from(s, 'base64').toString('binary'), console })
  const render = () => { cursor = 0; return exports.default() }
  render()
  effects.forEach((effect) => effect())
  mounting = false
  await new Promise(setImmediate)
  const tree = render()
  function buttons(node) {
    if (!node || typeof node !== 'object') return []
    return [...(node.type === 'button' ? [node] : []), ...[node.props?.children].flat(Infinity).flatMap(buttons)]
  }
  const activate = buttons(tree).find((node) => node.props.children === 'Ativar notificações')
  assert.ok(activate)
  await activate.props.onClick()
  assert.ok(calls.some((call) => call.url === '/api/notification-device' && call.body.action === 'activate'))
  assert.equal(calls.filter((call) => call.url === '/api/notification-device' && call.body.action === 'activate').length, 1)
})
