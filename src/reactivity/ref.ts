import { TrackEffects, TriggerEffect, isTracking } from "./effect";
import { reactive } from "./reactive";
import { hasChanged, isObject } from "../share/index";

export class RefImp {
    private _value: any;
    public dep: any;
    private rawValue: any;
    public _v_isRef = true;
    constructor(value) {
        this.rawValue = value
        // / 看看value 是不是一个对象，如果是一个对象的话
        this._value = isObject(value) ? reactive(value) : value
        this.dep = new Set()
    }
    get value() {
        if (isTracking()) {
            TrackEffects(this.dep)
        }
        return this._value
    }
    set value(newValue) {
        // if (Object.is(newValue, this._value)) return
        // 对比的时候让他都为对象
        // 因为value有可能是proxy对象
        if (hasChanged(newValue, this.rawValue)) {
            // this._value = newValue
            this.rawValue = newValue
            this._value = isObject(newValue) ? reactive(newValue) : newValue
            TriggerEffect(this.dep)
        }
    }

}
export function ref(value) {
    return new RefImp(value)
}

export function isRef(value) {
    return !!value._v_isRef
}
export function unRef(ref) {
    return isRef(ref) ? ref.value : ref
}
export function proxyRefs(objctWithRefs) {
    return new Proxy(objctWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key))
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return target[key].value = value
            } else {
                return Reflect.set(target, key, value)
            }

        }
    })
}