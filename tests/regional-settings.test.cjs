const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const cache = new Map()
function load(file) {
  if (cache.has(file)) return cache.get(file)
  const exports = {}
  cache.set(file, exports)
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { exports, Date, require: (id) => id.startsWith('./') ? load(`lib/${id.slice(2)}.ts`) : require(id) })
  return exports
}
const { getRegionalSettings, countryFromPhone, supportedCountry } = load('lib/regional-settings.ts')
const { validPhone, phoneCountry } = load('lib/phone-country.ts')
test('Angola uses current 21 provinces, kwanza and only local payment preferences', () => {
  const ao = getRegionalSettings('AO')
  assert.equal(ao.currency, 'AOA'); assert.equal(ao.symbol, 'Kz')
  assert.equal(ao.regions.length, 21)
  for (const region of ['Luanda', 'Cuando', 'Cubango', 'Icolo e Bengo', 'Moxico Leste']) assert.ok(ao.regions.includes(region))
  assert.ok(!ao.regions.includes('Maputo Cidade'))
  assert.deepEqual(Array.from(ao.methods, (method) => method.id), ['unitel-money', 'afrimoney'])
})
test('Cabo Verde asks for an inhabited island and uses escudos', () => {
  const cv = getRegionalSettings('CV')
  assert.equal(cv.regionLabel, 'Ilha'); assert.equal(cv.currency, 'CVE')
  assert.equal(cv.regions.length, 9); assert.ok(cv.regions.includes('Santiago'))
  assert.ok(!cv.regions.includes('Maputo Cidade'))
  assert.deepEqual(Array.from(cv.methods, (method) => method.id), ['televinti4', 'bank-transfer-cv'])
})
test('Mozambique keeps its provinces, currency and existing wallet IDs', () => {
  const mz = getRegionalSettings('MZ')
  assert.equal(mz.currency, 'MZN'); assert.ok(mz.regions.includes('Zambézia'))
  assert.deepEqual(Array.from(mz.methods, (method) => method.id), ['mpesa', 'emola', 'mkesh'])
})
test('saved international numbers recover country without changing existing Mozambique accounts', () => {
  assert.equal(countryFromPhone('244923000000'), 'AO')
  assert.equal(countryFromPhone('+238 991 00 00'), 'CV')
  assert.equal(countryFromPhone('840000000'), 'MZ')
  assert.ok(validPhone('923000000', phoneCountry('AO')))
  assert.ok(validPhone('9910000', phoneCountry('CV')))
  assert.ok(!validPhone('991000000', phoneCountry('CV')))
  assert.ok(!supportedCountry('ZZ')); assert.equal(getRegionalSettings('ZZ').code, 'MZ')
})
