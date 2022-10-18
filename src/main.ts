import { effect, obj } from './reactivity'


effect(() => {
  console.log('run...')
  document.body.innerHTML = obj.ok ? obj.text : 'not'
})

setTimeout(() => {
  obj.ok = false
}, 1000)

setTimeout(() => {
  obj.text = 'hello'
}, 2000)