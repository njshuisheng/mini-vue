import { ChildrenFlags, VNodeFlags } from "./flags"
import { createTextVNode } from './h'

// render
export function render(vnode, container) {
    const prevVNode = container.vnode
    if (prevVNode == null) {
        if (vnode) {
            mount(vnode, container)
            container.vnode = vnode
        }
    } else {
        if (vnode) {
            patch(prevVNode, vnode, container)
            container.vnode = vnode
        } else {
            container.removeChild(prevVNode.el)
            container.vnode = null
        }
    }
}

// mount
function mount(vnode, container, isSVG) {
    const { flags } = vnode
    if (flags & VNodeFlags.ELEMENT) {
        mountElement(vnode, container, isSVG)
    } else if (flags & VNodeFlags.COMPONENT) {
        mountComponent(vnode, container, isSVG)
    } else if (flags & VNodeFlags.TEXT) {
        mountText(vnode, container)
    } else if (flags & VNodeFlags.FRAGMENT) {
        mountFragment(vnode, container, isSVG)
    } else if (flags & VNodeFlags.PORTAL) {
        mountPortal(vnode, container)
    }

}

const domPropsRE = /\[A-Z]|^(?:value|checked|selected|muted)$/
function mountElement(vnode, container, isSVG) {
    isSVG = isSVG || vnode.flags & VNodeFlags.ELEMENT_SVG
    const el = isSVG
        ? document.createElementNS('http://www.w3.org/2000/svg', vnode.tag)
        : document.createElement(vnode.tag)
    vnode.el = el

    // 处理data
    const data = vnode.data
    if (data) {
        for (let key in data) {
            patchData(el, key, null, data[key])
        }
    }

    // 挂载children
    const childFlags = vnode.childFlags
    const children = vnode.children
    if (childFlags !== ChildrenFlags.NO_CHILDREN) {
        if (childFlags & ChildrenFlags.SINGLE_VNODE) {
            mount(children, el, isSVG)
        } else if (childFlags & ChildrenFlags.MULTIPLE_VNODES) {
            for (let i = 0; i < vnode.children.length; i++) {
                mount(vnode.children[i], el, isSVG)
            }
        }
    }

    container.appendChild(el)
}

function mountComponent(vnode, container, isSVG) {
    if (vnode.flags & VNodeFlags.COMPONENT_STATEFUL) {
        mountStateFulComponent(vnode, container, isSVG)
    } else {
        mountFunctionalComponent(vnode, container, isSVG)
    }
}

function mountStateFulComponent(vnode, container, isSVG) {
    const instance = new vnode.tag()
    instance.$vnode = instance.render()

    mount(instance.$vnode, container, isSVG)

    instance.$el = vnode.el = instance.$vnode.el
}
function mountFunctionalComponent(vnode, container, isSVG) {
    const $vnode = vnode.tag()

    mount($vnode, container, isSVG)

    vnode.el = $vnode.el
}

function mountText(vnode, container) {
    const el = document.createTextNode(vnode.children)

    vnode.el = el
    container.appendChild(el)
}
function mountFragment(vnode, container, isSVG) {
    const { children, childFlags } = vnode

    switch (childFlags) {
        case ChildrenFlags.SINGLE_VNODE:
            mount(vnode, container, isSVG)
            vnode.el = children.el
            break
        case ChildrenFlags.NO_CHILDREN:
            const placeholder = createTextVNode('')
            mountText(placeholder, container)
            vnode.el = placeholder.el
            break
        default:
            for (let i = 0; i < children.length; i++) {
                mount(children[i], container, isSVG)
            }
            vnode.el = children[0].el
            break
    }
}
function mountPortal(vnode, container) {
    const { tag, children, childFlags } = vnode

    const target = typeof tag === 'string' ? document.querySelector(tag) : tag

    if (childFlags & ChildrenFlags.SINGLE_VNODE) {
        mount(children, target)
    } else if (childFlags & ChildrenFlags.MULTIPLE_VNODES) {
        for (let i = 0; i < children.length; i++) {
            mount(children[i], target)
        }
    }

    const placeholder = createTextVNode('')
    mountText(placeholder, container)
    vnode.el = placeholder.el
}

// patch
function patch(prevVNode, nextVNode, container) {
    const prevFlags = prevVNode.flags
    const nextFlags = nextVNode.flags

    if (prevFlags !== nextFlags) {
        replaceVNode(prevVNode, nextVNode, container)
    } else if (nextFlags & VNodeFlags.ELEMENT) {
        patchElement(prevVNode, nextVNode, container)
    } else if (nextFlags & VNodeFlags.COMPONENT) {
        patchComponent(prevVNode, nextVNode, container)
    } else if (nextFlags & VNodeFlags.TEXT) {
        patchText(prevVNode, nextVNode, container)
    } else if (nextFlags & VNodeFlags.FRAGMENT) {
        patchFragment(prevVNode, nextVNode, container)
    } else if (nextFlags & VNodeFlags.PORTAL) {
        patchPortal(prevVNode, nextVNode, container)
    }
}

function replaceVNode(prevVNode, nextVNode, container) {
    container.removeChild(prevVNode.el)

    mount(nextVNode, container)
}
function patchElement(prevVNode, nextVNode, container) {
    if (prevVNode.tag !== nextVNode.tag) {
        replaceVNode(prevVNode, nextVNode, container)
        return
    }
    const el = (nextVNode.el = prevVNode.el)
    const prevData = prevVNode.data
    const nextData = nextVNode.data

    if (nextData) {
        for (let key in nextData) {
            const prevValue = prevData[key]
            const nextValue = nextData[key]
            patchData(el, key, prevValue, nextValue)
        }
    }
    if (prevData) {
        for (let key in prevData) {
            const prevValue = prevData[key]
            if (prevValue && !nextData.hasOwnProperty(key)) {
                patchData(el, key, prevValue, null)
            }
        }
    }

    patchChildren(prevVNode.childFlags, nextVNode.childFlags, prevVNode.children, nextVNode.children, el)
}

function patchChildren(
    prevChildFlags,
    nextChildFlags,
    prevChildren,
    nextChildren,
    container
  ) {
    switch (prevChildFlags) {
      // 旧的 children 是单个子节点，会执行该 case 语句块
      case ChildrenFlags.SINGLE_VNODE:
        switch (nextChildFlags) {
          case ChildrenFlags.SINGLE_VNODE:
            // 新的 children 也是单个子节点时，会执行该 case 语句块
                patch(prevChildren, nextChildren, container)
            break
          case ChildrenFlags.NO_CHILDREN:
            // 新的 children 中没有子节点时，会执行该 case 语句块
            break
          default:
            // 新的 children 中有多个子节点时，会执行该 case 语句块
            break
        }
        break
      // 旧的 children 中没有子节点时，会执行该 case 语句块
      case ChildrenFlags.NO_CHILDREN:
        switch (nextChildFlags) {
          case ChildrenFlags.SINGLE_VNODE:
            // 新的 children 是单个子节点时，会执行该 case 语句块
            break
          case ChildrenFlags.NO_CHILDREN:
            // 新的 children 中没有子节点时，会执行该 case 语句块
            break
          default:
            // 新的 children 中有多个子节点时，会执行该 case 语句块
            break
        }
        break
      // 旧的 children 中有多个子节点时，会执行该 case 语句块
      default:
        switch (nextChildFlags) {
          case ChildrenFlags.SINGLE_VNODE:
            // 新的 children 是单个子节点时，会执行该 case 语句块
            break
          case ChildrenFlags.NO_CHILDREN:
            // 新的 children 中没有子节点时，会执行该 case 语句块
            break
          default:
            // 新的 children 中有多个子节点时，会执行该 case 语句块
            break
        }
        break
    }
  }
function patchComponent(prevVNode, nextVNode, container) {}
function patchText(prevVNode, nextVNode, container) {}
function patchFragment(prevVNode, nextVNode, container) {}
function patchPortal(prevVNode, nextVNode, container) { }

function patchData(el, key, prevValue, nextValue) {
    switch (key) {
        case 'style':
            if (nextValue) {
                for (let k in nextValue) {
                    el.style[k] = nextValue[k]
                }
            }
            if (prevValue) {
                for (let k in prevValue) {
                    if (!nextValue.hasOwnProperty(k)) {
                        el.style[k] = ''
                    }
                }
            }
            break
        case 'class':
            if (nextValue) el.className = nextValue
            break
        default:
            if (key[0] === 'o' && key[1] === 'n') {
                // 事件
                if (prevValue) {
                    el.removeEventListener(key.slice(2), prevValue)
                }
                if (nextValue) {
                    el.addEventListener(key.slice(2), nextValue)
                }
            } else if (domPropsRE.test(key)) {
                el[key] = nextValue
            } else {
                el.setAttribute(key, nextValue)
            }
            break
    }
}