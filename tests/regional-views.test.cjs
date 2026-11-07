const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
function moduleAt(file, deps = {}) {
  const exports = {}
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: (id) => deps[id] || (id.startsWith('@/lib/') ? moduleAt(id.replace('@/', '') + '.ts') : id.startsWith('./') ? moduleAt('lib/' + id.slice(2) + '.ts') : require(id)), Intl, Date, console })
  return exports
}
const regional = moduleAt('lib/regional-settings.ts')
const phone = moduleAt('lib/phone-country.ts')
function renderWithdrawal(country, step = 'wallet') {
  let index = 0
  const settings = regional.getRegionalSettings(country)
  const result = { id: 'test', type: 'withdrawal', amount: 10, amountMZN: 0, localAmount: 1600, localCurrency: 'AOA', method: 'multicaixa-express', date: new Date(), status: 'completed' }
  const initial = [step, 'forward', country === 'AO' ? 'multicaixa-express' : 'mpesa', '923 123 456', '1000', '', false, 0, result]
  const h = React.createElement
  const { WithdrawFlow } = moduleAt('components/app/withdraw-flow.tsx', {
    react: { ...React, useState: () => [initial[index++], () => {}] },
    '@/components/regional-provider': { useRegionalSettings: () => settings, useRegionalCountry: () => ({ country: phone.phoneCountry(country) }), RegionBadge: () => h('span', {}, country) },
    '@/components/payment-method-icon': { PaymentMethodIcon: ({ method }) => h('img', { src: method.logo || undefined, alt: method.name }) },
    '@/components/onboarding/ui': { StepShell: ({ title, subtitle, children, footer }) => h('section', {}, title, subtitle, children, footer), PrimaryButton: ({ children }) => h('button', {}, children), GhostButton: ({ children }) => h('button', {}, children), OptionRow: ({ children, leading }) => h('div', {}, leading, children), PinField: () => h('input', { 'aria-label': 'PIN' }) },
    '@/components/ui/dots-loader': { DotsLoader: () => h('span', {}, '…') },
    './pix-symbol': { PixSymbol: () => h('span', {}, 'Pix') },
    '@/lib/analytics': { analytics: {} },
  })
  return renderToStaticMarkup(h(WithdrawFlow, { balance: 100, onWithdrawal() {}, onDone() {}, onGoToPix() {}, onCancel() {} }))
}
test('Angola wallet, number, processing, amount and receipt screens contain only local payment details', () => {
  for (const step of ['wallet', 'phone', 'confirm', 'amount', 'processing', 'success']) {
    const html = renderWithdrawal('AO', step)
    assert.doesNotMatch(html, /M-Pesa|e-Mola|mKesh|meticais|MZN|\+258|Em breve/, step)
    if (step === 'wallet') {
      assert.match(html, /MULTICAIXA Express/)
      assert.match(html, /UNITEL Money/)
      assert.match(html, /multicaixa-express.png/)
    }
    if (step === 'confirm') assert.match(html, /\+244/)
    if (step === 'amount' || step === 'success') assert.match(html, /Kz/)
  }
})
test('Mozambique still offers its original wallets', () => {
  const html = renderWithdrawal('MZ')
  assert.match(html, /M-Pesa/)
  assert.match(html, /e-Mola/)
  assert.doesNotMatch(html, /MULTICAIXA Express|UNITEL Money/)
})

