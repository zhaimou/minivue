import { effect } from "../reactivity/effect"
import { ShapeFlags } from "../share/ShapeFlag"
import { createComponentInstance, setupComponent, setupStatefulComponent } from "./component"
import { createApi } from "./createApp"
import { Fragment, Text, } from "./vNode"
import { shouldUpdatecomponet } from "./componentUpdateUtils"
import { queueJobs } from "./scheduler"
export function createRender(options) {
    const {
        createElement: hostcreateElement,
        patchProp: hostpatchProp,
        insert: hostinsert,
        remove: hostRemove,
        setElementText: hostSetElementText
    } = options
    function render(vNode, container) {
        patch(null, vNode, container, null, null)
    }
    // n1->老的
    // n2->新
    function patch(n1, n2, container = null, parentComponent = null, anchor = null) {
        // Implement
        const { type, shapeFlag } = n2
        switch (type) {
            case Fragment:
                ProcessFragment(n1, n2, container, parentComponent)
                break;
            case Text:
                ProcessText(n1, n2, container)
                break;
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container, parentComponent, anchor)
                } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    processComponent(n1, n2, container, parentComponent)
                }
        }
        // if (typeof vNode.type === "string") {
        // if (isObject(vNode.type)){

    }

    function processComponent(n1, n2: any, container: any, parentComponent,) {
        // console.log(n1, n2)
        if (!n1) {
            mountComponent(n2, container, parentComponent)
        } else {
            updateComponent(n1, n2)
        }
    }
    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component)
        if (shouldUpdatecomponet(n1, n2)) {
            instance.next = n2
            instance.update()
        } else {
            n2.el = n1.el
            instance.vnode = n2
        }

    }
    function mountComponent(initialVNode: any, container: any, parentComponent) {
        const instance = (initialVNode.component = createComponentInstance
            (initialVNode, parentComponent)
        )
        setupComponent(instance)
        setupRenderEffect(instance, initialVNode, container)
    }


    function setupRenderEffect(instance: any, initialVNode, container) {
        // 实现页面响应式
        instance.update = effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance
                const subTree = (instance.subTree = instance.render.call(proxy))
                // console.log(subTree)
                // 初始化
                patch(null, subTree, container, instance, null)
                // 挂载el
                // 需要知道在什么时机在初始化的地方获取el
                initialVNode.el = subTree.el
                instance.isMounted = true
            } else {
                // console.log("update")
                // 组件创造的props也得更新
                const { next, vnode } = instance
                if (next) {
                    next.el = vnode.el
                    updateComponentPreRender(instance, next)
                }

                const { proxy } = instance
                const subTree = instance.render.call(proxy);
                const prevSubTree = instance.subTree
                instance.subTree = subTree
                // patch()
                patch(prevSubTree, subTree, container, instance, null)
            }
        }, {
            // 调度器 解决调用多次渲染  只渲染结果
            scheduler() {
                console.log("update-scheduler")
                queueJobs(instance.update)
            }
        })
    }

    function processElement(n1, n2: string, container: any, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor)
        } else {
            patchElement(n1, n2, container, parentComponent, anchor)
        }
    }

    function mountElement(vNode, container: any, parentComponent, anchor) {
        // 将el存起来
        // 实现$el

        const el = (vNode.el = hostcreateElement(vNode.type))
        // debugger;
        const { children, shapeFlag, props } = vNode
        // if (typeof children === "string") {
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            el.textContent = children
            // } else if (Array.isArray(children)) {
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            // debugger;
            mountChildren(vNode.children, el, parentComponent)
        }
        for (const key in props) {
            const val = props[key]
            // console.log(key);
            // const isOn = (key: string) => /^on[A-Z]/.test(key)
            // if (isOn(key)) {
            // const event = key.slice(2).toLowerCase()
            // el.addEventListener(event, val)
            // }
            // el.setAttribute(key, val)
            hostpatchProp(el, key, null, val)
        }
        // container.append(el)
        hostinsert(el, container, anchor)
    }

    function mountChildren(children, container, parentComponent,) {
        children.forEach((v) => {
            patch(null, v, container, parentComponent)
        }
        )
    }

    function ProcessFragment(n1, n2: any, container: any, parentComponent) {
        mountChildren(n2.children, container, parentComponent)
    }
    function ProcessText(n1, n2: any, container: any) {
        const { children } = n2
        const textNode = (n2.el = document.createTextNode(children))
        container.append(textNode)
    }


    function patchElement(n1, n2: any, container: any, parentComponent, anchor) {

        const oldProps = (n1 && n1.props) || {}
        const newProps = n2.props || {}
        // 在mount(初始化)挂载的el 所以只有n1有el
        const el = (n2.el = n1.el)
        // 对比props
        patchProps(el, oldProps, newProps)

        patchChildren(n1, n2, el, parentComponent, anchor)
        // console.log(anchor)
    }

    function patchProps(el, oldProps: any, newProps: any) {
        for (const key in newProps) {
            const prevProp = oldProps[key]
            const nextProp = newProps[key]
            if (prevProp !== nextProp) {
                // patchProps()
                hostpatchProp(el, key, prevProp, nextProp)
            }
        }
        for (const key in oldProps) {
            if (!(key in newProps)) {
                hostpatchProp(el, key, oldProps[key], null)
            }
        }

    }
    function patchChildren(n1: any, n2: any, container, parentComponent, anchor) {
        const prevShapeFlag = n1.shapeFlag
        const { shapeFlag } = n2
        const c2 = n2.children
        const c1 = n1.children
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // 把老的children清空
                unmountChildren(n1.children)
            }
            // 设置text
            if (c1 !== c2) {
                hostSetElementText(container, c2)
            }
        } else {
            if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                hostSetElementText(container, "")
                mountChildren(c2, container, parentComponent)
            } else {
                //array diff array
                patchKeyedChildren(c1, c2, container, parentComponent, anchor)
            }
        }
    }
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el
            hostRemove(el)
        }
    }
    function patchKeyedChildren(c1: any, c2: any, container, parentComponent, parentAnchor) {
        let i = 0
        let e1 = c1.length - 1;
        let e2 = c2.length - 1
        console.log(c1)
        console.log(c2)
        function isSomeVNodeType(n1, n2) {
            return n1.type === n2.type && n1.key === n2.key
        }
        // 左侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[i]
            const n2 = c2[i]
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor)
            } else {
                break;
            }
            i++;
        }
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1]
            const n2 = c2[e2]
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor)
            } else {
                break;
            }
            e1--;
            e2--;
        }
        if (i > e1) {
            if (i <= e2) {
                const nextPos = e2 + 1;
                const anchor = e2 + 1 < c2.length ? c2[nextPos].el : null
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor)
                    i++;
                }
            }
        } else if (i > e2) {
            while (i <= e1) {
                hostRemove(c1[i].el)
                i++
            }
        } else { // Array to Array 中间乱序
            let s1 = i;
            let s2 = i;
            const keyToNewIndexMap = new Map()
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i]
                keyToNewIndexMap.set(nextChild.key, i)
            }
            const toBePatched = e2 - s2 + 1;
            let patched = 0;
            const newIndexToOldIndexMap = new Array(toBePatched)
            // 中间值发生改变再调用方法
            let moved = false;
            let maxNewIndexSoFar = 0
            for (let i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0

            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el)
                    continue;
                }
                let newIndex;
                if (prevChild.key != null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key)
                } else {
                    for (let j = s2; j <= e2; j++) {
                        if (isSomeVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    hostRemove(prevChild.el)
                } else {
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex
                    } else {
                        moved = true
                    }
                    // 能代表新节点存在
                    newIndexToOldIndexMap[newIndex - s2] = i + 1; //不能把值设为0 他是有特殊意义的 
                    patch(prevChild, c2[newIndex], container, parentComponent, null)
                    patched++;
                }
            }

            const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : []
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex]
                const anchor = nextIndex + 1 < c2.length ? c2[nextIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, parentComponent, anchor)
                }
                if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        hostinsert(nextChild.el, container, anchor)
                    } else {
                        j--
                    }
                }
            }

        }


    }

    function updateComponentPreRender(instance: any, next: any) {
        next.component = instance
        instance.vnode = next
        instance.next = null
        instance.props = next.props
    }
    return {
        createApp: createApi(render)
    }
}

function getSequence(arr: number[]): number[] {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                } else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

