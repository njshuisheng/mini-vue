const VNodeFlags = {
    ELEMENT_HTML: 1, // html标签
    ELEMENT_SVG: 1 << 1, // SVG标签

    COMPONENT_STATEFUL_NORMAL: 1 << 2, // 普通有状态组件
    COMPONENT_STATEFUL_SHOULD_KEEP_ALIVE: 1 << 3, // 需要被kiveAlive的有状态组件
    COMPONENT_STATEFUL_KEEP_ALIVE: 1 << 4, // 已经被kiveAlive的有状态组件
    COMPONENT_FUNCTIONAL: 1 << 5, // 函数式组件

    TEXT: 1 << 6, // 纯文本
    FRAGMENT: 1 << 7, // Fragment
    PORTAL: 1 << 8 // Portal
}

const ChildrenFlags = {
    UNKNOWN_CHILDREN: 0, // 未知children类型
    NO_CHILDREN: 1, // 没有children
    SINGLE_VNODE: 1 << 1, // 单个VNode
    KEYED_VNODE: 1 << 2, // 多个拥有key的VNode
    NONE_KEYED_VNODES: 1 << 3 // 多个没有key的VNode
}

//@ts-ignore
ChildrenFlags.MULTIPLE_VNODES = ChildrenFlags.KEYED_VNODE | ChildrenFlags.NONE_KEYED_VNODES

//@ts-ignore
VNodeFlags.ELEMENT = VNodeFlags.ELEMENT_HTML | VNodeFlags.ELEMENT_SVG
//@ts-ignore
VNodeFlags.COMPONENT_STATEFUL =
    VNodeFlags.COMPONENT_STATEFUL_NORMAL |
    VNodeFlags.COMPONENT_STATEFUL_SHOULD_KEEP_ALIVE |
    VNodeFlags.COMPONENT_STATEFUL_KEEP_ALIVE
//@ts-ignore
VNodeFlags.COMPONENT = VNodeFlags.COMPONENT_STATEFUL_NORMAL | VNodeFlags.COMPONENT_FUNCTIONAL

export { VNodeFlags, ChildrenFlags }