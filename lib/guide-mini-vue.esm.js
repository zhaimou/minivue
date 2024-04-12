const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        el: null,
        component: null,
        key: props && props.key,
        shapeFlag: getShapeFlag(type),
    };
    if (typeof children === "string") {
        vnode.shapeFlag = vnode.shapeFlag | 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag = vnode.shapeFlag | 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (typeof children === "object") {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === "string" ? 1 /* ShapeFlags.ELEMENT */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === "function") {
            // 这样做会多一层div
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

const extend = Object.assign;
function isObject(raw) {
    if (raw === null) {
        return false;
    }
    else if (typeof raw === 'object' || typeof raw === 'function') {
        return true;
    }
    else {
        return false;
    }
}
const hasChanged = (val, newVal) => {
    return !Object.is(val, newVal);
};
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);

let activeEffect;
let shouldTrack;
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.deps = [];
        this.active = true;
        this.scheduler = scheduler;
        this._fn = fn;
    }
    run() {
        // 拿到_effet实例对象
        if (!this.active) {
            this._fn();
        }
        // 优化stop
        shouldTrack = true;
        activeEffect = this;
        const res = this._fn();
        shouldTrack = false;
        return res;
    }
    stop() {
        // deps是set
        if (this.active) {
            cleanEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanEffect(effect) {
    effect.deps.forEach((item) => {
        return item.delete(effect);
    });
    effect.deps.length = 0;
}
const targetMap = new Map();
function track(target, key) {
    // 先存target 再存keye 再得dep
    // isTracking()
    if (!isTracking())
        return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    TrackEffects(dep);
}
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
function TrackEffects(dep) {
    if (!dep.has(activeEffect)) {
        dep.add(activeEffect);
        activeEffect.deps.push(dep);
    }
}
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    if (!depsMap)
        return;
    let dep = depsMap.get(key);
    // console.log(dep)
    TriggerEffect(dep);
}
function TriggerEffect(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            // scheduler 可以让用户自己选择调用的时机
            // 这样就可以灵活的控制调用了
            // 在 runtime-core 中，就是使用了 scheduler 实现了在 next ticker 中调用的逻辑
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
// scheduler需求分析  意思是调度器
// 通过effect第二个参数给一个schedulerfn
// effect第一次执行的时候 还会执行fn
// 当响应式对象set update不会执行fn 而是执行scheduler
// 如何说当runner时候 会再次执行fn  
function effect(fn, options = {}) {
    let scheduler = options.scheduler;
    const _effect = new ReactiveEffect(fn, scheduler);
    // Object.assign(_effect, options)
    // _effect.onStop = options.onStop
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}
// it('', () => {
//    effect(fn) =>  function (runner) => 执行fn => return 调用runner会拿到fn的返回值
// let num = 10;
// const runner = effect(
// () => {
// num++;
// return 'zhaimou'
// }
// )
// expect(num).toBe(11);
// const r = runner()
// expect(num).toBe(12);
// expect(r).toBe('zhaimou');
// })

const get = createGetter();
const set = createSetter();
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        // target 当前对象 key为键
        // console.log(key)
        if (key === "is_reactive") {
            return !isReadonly;
        }
        else if (key === "is_readonly") {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (shallow) {
            return res;
        }
        // 实现嵌套对象为reactive对象
        if (isObject(res)) {
            return isReadonly ? reactive(res) : readonly(res);
        }
        // 依赖收集
        if (!isReadonly) {
            track(target, key);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
const mutableHandler = {
    // get: createGetter(),
    // 换成get不用每次函数都得再执行，
    get,
    set,
};
const readOnlyHandler = {
    get: createGetter(true),
    set(target, key, value) {
        console.warn(`你改变了${key}值,但${target}为readonly值`);
        return true;
    }
};
const shallowReadonlyHandlers = {
    get: shallowReadonlyGet,
    set(target, key) {
        // readonly 的响应式对象不可以修改值
        console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target);
        return true;
    },
};

function reactive(raw) {
    return createActiveObject(raw, mutableHandler);
}
function readonly(raw) {
    return createActiveObject(raw, readOnlyHandler);
}
function shallowReadonly(raw) {
    return createActiveObject(raw, shallowReadonlyHandlers);
}
function createActiveObject(raw, baseHanders) {
    if (!isObject(raw)) {
        console.warn(`${raw}不是一个对象`);
        return raw;
    }
    return new Proxy(raw, baseHanders);
}

class RefImp {
    constructor(value) {
        this._v_isRef = true;
        this.rawValue = value;
        // / 看看value 是不是一个对象，如果是一个对象的话
        this._value = isObject(value) ? reactive(value) : value;
        this.dep = new Set();
    }
    get value() {
        if (isTracking()) {
            TrackEffects(this.dep);
        }
        return this._value;
    }
    set value(newValue) {
        // if (Object.is(newValue, this._value)) return
        // 对比的时候让他都为对象
        // 因为value有可能是proxy对象
        if (hasChanged(newValue, this.rawValue)) {
            // this._value = newValue
            this.rawValue = newValue;
            this._value = isObject(newValue) ? reactive(newValue) : newValue;
            TriggerEffect(this.dep);
        }
    }
}
function ref(value) {
    return new RefImp(value);
}
function isRef(value) {
    return !!value._v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objctWithRefs) {
    return new Proxy(objctWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return target[key].value = value;
            }
            else {
                return Reflect.set(target, key, value);
            }
        }
    });
}

function emit(instance, event, ...args) {
    // console.log()a
    // instanceof.props 中有没有event
    const { props } = instance;
    // TPP
    // add -> Add
    const capitalize = (event) => {
        return event.charAt(0).toUpperCase() + event.slice(1);
    };
    const toHavelerKey = (str) => {
        return str ? "on" + capitalize(str) : "";
    };
    const camelize = (str) => {
        return str.replace(/-(\w)/g, (_, c) => {
            return c ? c.toUpperCase() : "";
        });
    };
    const handler = props[toHavelerKey(camelize(event))];
    handler && handler(...args);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
    $props: (i) => i.props,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (key in setupState) {
            return setupState[key];
        }
        if (hasOwn(setupState, key)) {
            return setupState.key;
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

function initSlots(instance, children) {
    // instance.slots = Array.isArray(children) ? children : [children]
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        const slots = {};
        for (const key in children) {
            const value = children[key];
            slots[key] = (props) => normalizeSlotValue(value(props));
        }
        instance.slots = slots;
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parent) {
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
    };
    // 能解决 第一个参数不传
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    // debugger;
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        CurrentInstance = instance;
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit
        });
        CurrentInstance = null;
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === "object") {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}
let CurrentInstance = null;
function getCurrentInstance() {
    return CurrentInstance;
}

function provide(key, value) {
    // 存
    const CurrentInstance = getCurrentInstance();
    // console.log(CurrentInstance)
    if (CurrentInstance) {
        let { provides } = CurrentInstance;
        const parentProvides = CurrentInstance.parent.provides;
        // 让他在执行一次后不再执行
        if (provides === parentProvides) {
            provides = CurrentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    const CurrentInstance = getCurrentInstance();
    if (CurrentInstance) {
        // const { parent } = CurrentInstance
        const parentProvides = CurrentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === "function") {
                defaultValue();
            }
            return defaultValue;
        }
    }
}

// import { render } from "./renderer"
function createApi(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                //   先虚拟节点 vnode
                // 所有的的操作都在对后
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            },
        };
    };
}

function shouldUpdatecomponet(prevVNode, nextVNode) {
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

const queue = [];
let isFlushPending = false;
function nextTick(fn) {
    return fn ? Promise.resolve().then(fn) : Promise.resolve();
}
function queueJobs(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    // 在微任务时执行
    queueFlush();
}
function queueFlush() {
    if (isFlushPending)
        return;
    isFlushPending = true;
    nextTick(flushJobs);
}
function flushJobs() {
    isFlushPending = false;
    let job;
    while ((job = queue.shift())) {
        job && job();
    }
}

function createRender(options) {
    const { createElement: hostcreateElement, patchProp: hostpatchProp, insert: hostinsert, remove: hostRemove, setElementText: hostSetElementText } = options;
    function render(vNode, container) {
        patch(null, vNode, container, null, null);
    }
    // n1->老的
    // n2->新
    function patch(n1, n2, container = null, parentComponent = null, anchor = null) {
        // Implement
        const { type, shapeFlag } = n2;
        switch (type) {
            case Fragment:
                ProcessFragment(n1, n2, container, parentComponent);
                break;
            case Text:
                ProcessText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent);
                }
        }
        // if (typeof vNode.type === "string") {
        // if (isObject(vNode.type)){
    }
    function processComponent(n1, n2, container, parentComponent) {
        // console.log(n1, n2)
        if (!n1) {
            mountComponent(n2, container, parentComponent);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component);
        if (shouldUpdatecomponet(n1, n2)) {
            instance.next = n2;
            instance.update();
        }
        else {
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function mountComponent(initialVNode, container, parentComponent) {
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
        setupComponent(instance);
        setupRenderEffect(instance, initialVNode, container);
    }
    function setupRenderEffect(instance, initialVNode, container) {
        // 实现页面响应式
        instance.update = effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy));
                // console.log(subTree)
                // 初始化
                patch(null, subTree, container, instance, null);
                // 挂载el
                // 需要知道在什么时机在初始化的地方获取el
                initialVNode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                // console.log("update")
                // 组件创造的props也得更新
                const { next, vnode } = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const { proxy } = instance;
                const subTree = instance.render.call(proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                // patch()
                patch(prevSubTree, subTree, container, instance, null);
            }
        }, {
            // 调度器 解决调用多次渲染  只渲染结果
            scheduler() {
                console.log("update-scheduler");
                queueJobs(instance.update);
            }
        });
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function mountElement(vNode, container, parentComponent, anchor) {
        // 将el存起来
        // 实现$el
        const el = (vNode.el = hostcreateElement(vNode.type));
        // debugger;
        const { children, shapeFlag, props } = vNode;
        // if (typeof children === "string") {
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
            // } else if (Array.isArray(children)) {
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            // debugger;
            mountChildren(vNode.children, el, parentComponent);
        }
        for (const key in props) {
            const val = props[key];
            // console.log(key);
            // const isOn = (key: string) => /^on[A-Z]/.test(key)
            // if (isOn(key)) {
            // const event = key.slice(2).toLowerCase()
            // el.addEventListener(event, val)
            // }
            // el.setAttribute(key, val)
            hostpatchProp(el, key, null, val);
        }
        // container.append(el)
        hostinsert(el, container, anchor);
    }
    function mountChildren(children, container, parentComponent) {
        children.forEach((v) => {
            patch(null, v, container, parentComponent);
        });
    }
    function ProcessFragment(n1, n2, container, parentComponent) {
        mountChildren(n2.children, container, parentComponent);
    }
    function ProcessText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        const oldProps = (n1 && n1.props) || {};
        const newProps = n2.props || {};
        // 在mount(初始化)挂载的el 所以只有n1有el
        const el = (n2.el = n1.el);
        // 对比props
        patchProps(el, oldProps, newProps);
        patchChildren(n1, n2, el, parentComponent, anchor);
        // console.log(anchor)
    }
    function patchProps(el, oldProps, newProps) {
        for (const key in newProps) {
            const prevProp = oldProps[key];
            const nextProp = newProps[key];
            if (prevProp !== nextProp) {
                // patchProps()
                hostpatchProp(el, key, prevProp, nextProp);
            }
        }
        for (const key in oldProps) {
            if (!(key in newProps)) {
                hostpatchProp(el, key, oldProps[key], null);
            }
        }
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const prevShapeFlag = n1.shapeFlag;
        const { shapeFlag } = n2;
        const c2 = n2.children;
        const c1 = n1.children;
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            if (prevShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                // 把老的children清空
                unmountChildren(n1.children);
            }
            // 设置text
            if (c1 !== c2) {
                hostSetElementText(container, c2);
            }
        }
        else {
            if (prevShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                hostSetElementText(container, "");
                mountChildren(c2, container, parentComponent);
            }
            else {
                //array diff array
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            hostRemove(el);
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = c2.length - 1;
        console.log(c1);
        console.log(c2);
        function isSomeVNodeType(n1, n2) {
            return n1.type === n2.type && n1.key === n2.key;
        }
        // 左侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            i++;
        }
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        if (i > e1) {
            if (i <= e2) {
                const nextPos = e2 + 1;
                const anchor = e2 + 1 < c2.length ? c2[nextPos].el : null;
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        else if (i > e2) {
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else { // Array to Array 中间乱序
            let s1 = i;
            let s2 = i;
            const keyToNewIndexMap = new Map();
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            const toBePatched = e2 - s2 + 1;
            let patched = 0;
            const newIndexToOldIndexMap = new Array(toBePatched);
            // 中间值发生改变再调用方法
            let moved = false;
            let maxNewIndexSoFar = 0;
            for (let i = 0; i < toBePatched; i++)
                newIndexToOldIndexMap[i] = 0;
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                let newIndex;
                if (prevChild.key != null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    for (let j = s2; j <= e2; j++) {
                        if (isSomeVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    // 能代表新节点存在
                    newIndexToOldIndexMap[newIndex - s2] = i + 1; //不能把值设为0 他是有特殊意义的 
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < c2.length ? c2[nextIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        hostinsert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
    }
    function updateComponentPreRender(instance, next) {
        next.component = instance;
        instance.vnode = next;
        instance.next = null;
        instance.props = next.props;
    }
    return {
        createApp: createApi(render)
    };
}
function getSequence(arr) {
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
                }
                else {
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

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevVal, nextVal) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(child, parent, anchor = null) {
    // parent.append(el)
    // console.log('insert')
    // console.log("anchor", anchor)
    // console.log("child:", child)
    // if (parent.contains(anchor)) {
    //     console.log("zailimai:", child)
    // }
    // console.log(parent)
    // console.log(parent.lastElementChild)
    // if (!anchor) {
    parent.insertBefore(child, anchor);
    // } else {
    // parent.lastElementChild.insertBefore(child, anchor)
    // }
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRender({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText
});
function createApp(...args) {
    return renderer.createApp(...args);
}

export { createApp, createRender, createTextVNode, getCurrentInstance, h, inject, nextTick, provide, proxyRefs, ref, renderSlots };
