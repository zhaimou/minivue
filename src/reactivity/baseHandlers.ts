import { isObject } from "../share/index"
import { track, trigger } from "./effect"
import { reactive, readonly } from "./reactive"

const get = createGetter()
const set = createSetter()
const shallowReadonlyGet = createGetter(true, true)
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        // target 当前对象 key为键
        // console.log(key)
        if (key === "is_reactive") {
            return !isReadonly
        } else if (key === "is_readonly") {
            return isReadonly
        }
        const res = Reflect.get(target, key)
        if (shallow) {
            return res
        }
        // 实现嵌套对象为reactive对象
        if (isObject(res)) {
            return isReadonly ? reactive(res) : readonly(res)
        }
        // 依赖收集
        if (!isReadonly) {
            track(target, key);
        }
        return res

    }
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value)
        trigger(target, key)
        return res
    }
}
export const mutableHandler = {
    // get: createGetter(),
    // 换成get不用每次函数都得再执行，
    get,
    set,
}


export const readOnlyHandler = {
    get: createGetter(true),
    set(target, key, value) {
        console.warn(`你改变了${key}值,但${target}为readonly值`)
        return true;
    }

}
export const shallowReadonlyHandlers = {
    get: shallowReadonlyGet,
    set(target, key) {
        // readonly 的响应式对象不可以修改值
        console.warn(
            `Set operation on key "${String(key)}" failed: target is readonly.`,
            target
        );
        return true;
    },
};

