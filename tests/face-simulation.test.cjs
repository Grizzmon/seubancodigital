const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const jsx = require('react/jsx-runtime')

test('face demo stops the preview, processes on white, and completes at ten seconds without saving images', async () => {
  const slots = [], pending = [], timers = new Map()
  let cursor = 0, time = 0, nextTimer = 0, stops = 0, confirmed = false
  const hooks = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], (v) => { slots[i] = v }] },
    useRef(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i] },
    useEffect(fn, deps) {
      const i = cursor++, old = slots[i]
      if (!old || deps.some((d, index) => d !== old.deps[index])) {
        pending.push(() => { old?.cleanup?.(); slots[i] = { deps, cleanup: fn() } })
      }
    },
  }
  const window = { setTimeout(fn, delay) { const id = ++nextTimer; timers.set(id, { fn, at: time + delay }); return id }, clearTimeout: (id) => timers.delete(id) }
  const stream = { getTracks: () => [{ stop: () => { stops++ } }] }
  const deps = { react: hooks, 'react/jsx-runtime': jsx, './ui': { PrimaryButton: 'primary' },
    'lucide-react': { Camera: 'camera', Check: 'check', LoaderCircle: 'loader', UserRound: 'user' } }
  const exports = {}
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('components/onboarding/face-simulation.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  }).outputText, { exports, require: (id) => deps[id], window,
    navigator: { mediaDevices: { getUserMedia: async () => stream } } })
  function nodes(node) {
    if (!node || typeof node !== 'object') return []
    return [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)]
  }
  function render() { cursor = 0; const tree = exports.FaceSimulation({ onConfirm: () => { confirmed = true } }); while (pending.length) pending.shift()(); return tree }
  function advance(ms) { time += ms; for (const [id, timer] of [...timers]) if (timer.at <= time) { timers.delete(id); timer.fn() } }
  let tree = render()
  const video = nodes(tree).find((node) => node.type === 'video')
  video.props.ref.current = { play: async () => {}, srcObject: null }
  await nodes(tree).find((node) => node.type === 'primary').props.onClick()
  // UI handler intentionally launches the camera asynchronously.
  await new Promise(setImmediate)
  tree = render()
  assert.equal(nodes(tree).some((node) => node.type === 'video'), true)
  advance(2000); tree = render()
  assert.equal(stops, 1)
  assert.equal(nodes(tree).some((node) => node.type === 'video'), false)
  assert.equal(nodes(tree).some((node) => node.type === 'loader'), true)
  advance(7999); tree = render()
  assert.equal(nodes(tree).some((node) => node.type === 'check'), false)
  advance(1); tree = render()
  assert.equal(nodes(tree).some((node) => node.type === 'check'), true)
  nodes(tree).find((node) => node.type === 'primary').props.onClick()
  assert.equal(confirmed, true)
})
