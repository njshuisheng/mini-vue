import { LooseObject } from "@/types"
import { ChildrenFlags, VNodeFlags } from "./flags"

type Tag = string | Symbol | Object | Function

export interface VNode {
    _isVNode: true
    flags: number
    data: LooseObject
    tag: Tag
    children: string | VNode[] | VNode | null,
    childFlags: number
    el: any
    key?: string
}

export const Fragment = Symbol()
export const Portal = Symbol()

function normalizeVNodes(children: VNode[]) {
    const newChildren = []
    for (let i = 0; i < children.length; i++) {
        const child = children[i]

        if (child.key == null) {
            child.key = '|' + i
        }

        newChildren.push(child)
    }

    return newChildren
}

export function createTextVNode(text: string) {
    return {
        _isNode: true,
        flags: VNodeFlags.TEXT,
        tag: null,
        data: null,
        children: text,
        childrenFlags: ChildrenFlags.NO_CHILDREN,
        el: null
    }
}

function normalizeClass(classValue) {
    let className = ''

    if (typeof classValue === 'string') {
        className = classValue
    } else if (Array.isArray(classValue)) {
        for (let i = 0; i < classValue.length; i++) {
            className += normalizeClass(classValue[i]) + ' '
        }
    } else if (typeof classValue === 'object') {
        for (const name in classValue) {
            classValue[name] && (className += name + ' ')
        }
    }

    return className.trim()
}

export function h(tag: Tag, data, children = null): VNode { 
    let flags = null, childFlags = null

    if (typeof tag === 'string') {
        flags = tag === 'svg' ? VNodeFlags.ELEMENT_SVG : VNodeFlags.ELEMENT_HTML
        // 序列化class
        if (data) {
            data.class = normalizeClass(data.class)
        }
    } else if (tag === Fragment) {
        flags = VNodeFlags.FRAGMENT
    } else if (tag === Portal) {
        flags = VNodeFlags.PORTAL
        tag = data && data.target
    } else {
        if (tag !== null && typeof tag === 'object') {
            flags = tag.functional
                ? VNodeFlags.COMPONENT_FUNCTIONAL // 函数式组件
                : VNodeFlags.COMPONENT_STATEFUL_NORMAL // 有状态组件
        } else if (typeof tag === 'function') {
            flags = tag.prototype && tag.prototype.render
                ? VNodeFlags.COMPONENT_STATEFUL_NORMAL
                : VNodeFlags.COMPONENT_FUNCTIONAL
        }
    }

    if (Array.isArray(children)) {
        const { length } = children
        if (length === 0) {
            childFlags = ChildrenFlags.NO_CHILDREN
        } else if (length === 1) {
            childFlags = ChildrenFlags.SINGLE_VNODE
            children = children[0]
        } else {
            childFlags = ChildrenFlags.KEYED_VNODE
            children = normalizeVNodes(children)
        }
    } else if (children == null) {
        childFlags = ChildrenFlags.NO_CHILDREN
    } else if (children._isVNode) {
        childFlags = ChildrenFlags.SINGLE_VNODE
    } else {
        childFlags = ChildrenFlags.SINGLE_VNODE
        children = createTextVNode(children + '')
    }

    return {
        _isVNode: true,
        flags,
        tag,
        data,
        children,
        childFlags,
        el: null
    }
}