import { noop, LooseObject } from '@/types'

const bucket = new WeakMap<LooseObject, Map<string, Set<noop>>>() // 此处使用WeakMap的原因是key的弱引用，不影响垃圾回收机制的工作

const data = { text: 'hi~', ok: true }

let activeEffect: noop
const obj = new Proxy(data, {
  get(target, key) {
    track(target, key)

    return Reflect.get(target, key)
  },
  set(target, key, value) {
    Reflect.set(target, key, value)

    trigger(target, key)

    return true
  },
})

// 在get拦截函数内调用track函数追踪变化
function track(target: LooseObject, key: string) {
  if (!activeEffect) return Reflect.get(target, key)

  let depMap = bucket.get(target)
  if (!depMap) {
    bucket.set(target, (depMap = new Map()))
  }

  let deps = depMap.get(key) // 此处deps为key的依赖集合
  if (!deps) {
    depMap.set(key, (deps = new Set()))
  }

  deps.add(activeEffect)

  activeEffect.deps.push(deps)

  console.log(bucket)
}

// 在set拦截函数内调用trigger函数触发变化
function trigger(target: LooseObject, key: string) {
  const depsMap = bucket.get(target)

  if (!depsMap) return
  const effects = depsMap.get(key)

  const effectsToRun = new Set(effects)
  effectsToRun.forEach(effectFn => effectFn())
  // effects && effects.forEach(fn => fn())
}

export function effect(fn: noop) {
  const effectFn = () => {
    cleanup(effectFn) // 调用此函数完成清除工作
    activeEffect = effectFn
    fn()
  }

  effectFn.deps = []
  effectFn()
}

function cleanup(effectFn) {
  for (let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i]

    deps.delete(effectFn)
  }

  effectFn.deps.length = 0
}

export { obj }
