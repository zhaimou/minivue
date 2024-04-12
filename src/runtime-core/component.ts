import { shallowReadonly } from "../reactivity/reactive"
import { proxyRefs } from "../reactivity/ref"
import { emit } from "./componentEmit"
import { initProps } from "./componentProps"
import { PublicInstanceProxyHandlers } from "./componentPublicInstance"
import { initSlots } from "./componentSlots"

export function createComponentInstance(vnode: any, parent: any) {
    // debugger
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        next: null,
        provides: parent ? parent.provides : {},
        isMounted: false,
        parent,
        subTree: {},
        emit: () => {
        }
    }
    // 能解决 第一个参数不传
    component.emit = emit.bind(null, component) as any;
    return component
}
export function setupComponent(instance) {
    initProps(instance, instance.vnode.props)
    initSlots(instance, instance.vnode.children)
    // debugger;
    setupStatefulComponent(instance)
}

export function setupStatefulComponent(instance) {

    const Component = instance.type
    instance.proxy = new Proxy({ _: instance },
        PublicInstanceProxyHandlers

    )
    const { setup } = Component
    if (setup) {
        CurrentInstance = instance
        const setupResult = setup(shallowReadonly(instance.props,
        ), {
            emit: instance.emit
        })
        CurrentInstance = null
        handleSetupResult(instance, setupResult)
    }
}

function handleSetupResult(instance, setupResult: any) {
    if (typeof setupResult === "object") {
        instance.setupState = proxyRefs(setupResult)
    }
    finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
    const Component = instance.type
    if (Component.render) {
        instance.render = Component.render
    }
}
let CurrentInstance = null
export function getCurrentInstance() {
    return CurrentInstance
}

