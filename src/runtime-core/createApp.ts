// import { render } from "./renderer"
import { createVNode } from "./vNode"
export function createApi(render) {
    return function createApp(rootComponent) {

        return {
            mount(rootContainer) {
                //   先虚拟节点 vnode
                // 所有的的操作都在对后
                const vnode = createVNode(rootComponent)
                render(vnode, rootContainer)
            },

        }
    }
}