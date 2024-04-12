import { ReactiveEffect } from "./effect"


export class ComputedRefImpl {
    private _getter: any
    private _dirty: boolean = true
    private _value: any
    private _effect: any
    constructor(getter) {
        this._getter = getter
        this._effect = new ReactiveEffect(getter, () => {
            if (!this._dirty) {
                this._dirty = true
            }
        })
    }
    get value() {
        if (this._dirty) {
            // 控制只调用一次
            // 如果依赖改变再打开阀门
            // 所以需要引入依赖
            this._dirty = false
            // this._value = this._getter()
            this._value = this._effect.run()
        }
        return this._value
    }


}

export function computed(getter) {
    return new ComputedRefImpl(getter)
}