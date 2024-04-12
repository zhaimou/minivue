export const extend = Object.assign;

export function isObject(raw) {
    if (raw === null) {
        return false
    } else if (typeof raw === 'object' || typeof raw === 'function') {
        return true
    } else {
        return false
    }
}
export const hasChanged = (val, newVal) => {
    return !Object.is(val, newVal)
}
export const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key)