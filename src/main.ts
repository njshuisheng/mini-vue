import { h, Fragment, Portal } from './renderer/h'
import { render } from './renderer/render'



// 旧的 VNode
const prevVNode = h('div', null,
  h('p', {
    style: {
      height: '100px',
      width: '100px',
      background: 'red'
    }
  })
)

// 新的 VNode
const nextVNode = h('div', null,
  h('p', {
    style: {
      height: '100px',
      width: '100px',
      background: 'green'
    }
  })
)
render(prevVNode, document.getElementById('app'))
setTimeout(() => {
  render(nextVNode, document.getElementById('app'))
}, 2000)