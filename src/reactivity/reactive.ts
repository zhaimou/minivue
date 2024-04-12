import { isObject } from '../share/index';
import { mutableHandler, readOnlyHandler, shallowReadonlyHandlers } from './baseHandlers';
export function reactive(raw: any) {
    return createActiveObject(raw, mutableHandler)
}
export function readonly(raw) {
    return createActiveObject(raw, readOnlyHandler)
}
export function shallowReadonly(raw) {
    return createActiveObject(raw, shallowReadonlyHandlers)
}
function createActiveObject(raw: any, baseHanders) {
    if (!isObject(raw)) {
        console.warn(`${raw}不是一个对象`)
        return raw
    }
    return new Proxy(raw, baseHanders)
}
export function isReactive(value) {
    // 做成布尔值,
    return !!value["is_reactive"]
}
export function isReadonly(value) {
    return !!value["is_readonly"]
}
export function isProxy(value) {
    return isReactive(value) || isReadonly(value)
}