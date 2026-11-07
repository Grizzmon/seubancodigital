const { test } = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const fs = require('node:fs')
const ts = require('typescript')
const React = require('react')
function load(file, deps = {}, globals = {}) {
  const exports = {}
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText,
    { exports, require: (id) => deps[id] || (id.startsWith('@/lib/') ? load(id.replace('@/', '') + '.ts') : id.startsWith('./') ? load('lib/' + id.slice(2) + '.ts') : require(id)), Date, Intl, ...globals })
  return exports
}
test('manual Angola choice wins over a Mozambique profile, survives account refresh and can be changed back', () => {
  const slots = [], effects = [], events = new Map(), data = new Map([['realpayz_country', 'AO']])
  let index = 0, mounting = true
  const hooks = { ...React,
    useState(initial) { const i = index++; if (!(i in slots)) slots[i] = initial; return [slots[i], (value) => { slots[i] = value }] },
    useRef(initial) { const i = index++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i] },
    useEffect(fn) { if (mounting) effects.push(fn) },
  }
  const { RegionalProvider } = load('components/regional-provider.tsx', {
    react: hooks,
    '@/lib/stored-user': { loadRememberedUser: () => ({ name: 'Aluno', phone: '840000000', countryCode: 'MZ' }) },
  }, {
    localStorage: { getItem: (key) => data.get(key) || null, setItem: (key, value) => data.set(key, value) },
    window: { addEventListener: (name, callback) => events.set(name, callback), removeEventListener() {} },
    AbortController, setTimeout, clearTimeout,
    fetch() { throw new Error('Manual country selection must not consult IP location') },
  })
  function render() { index = 0; return RegionalProvider({ children: 'app' }) }
  render(); effects.forEach((effect) => effect()); mounting = false
  assert.equal(render().props.value.country.code, 'AO')
  events.get('bankpix-user-ready')()
  assert.equal(render().props.value.country.code, 'AO')
  render().props.value.changeCountry('MZ')
  assert.equal(render().props.value.country.code, 'MZ')
  assert.equal(data.get('realpayz_country'), 'MZ')
})
