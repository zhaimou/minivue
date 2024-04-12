import { extend } from '../share/index';
let activeEffect;
let shouldTrack;
export class ReactiveEffect {
    private _fn: any;
    deps = [];
    active = true;
    onStop?: () => void;
    public scheduler: Function | undefined;
    constructor(fn, scheduler?: Function) {
        this.scheduler = scheduler
        this._fn = fn
    }
    run() {
        // 拿到_effet实例对象
        if (!this.active) {
            this._fn()
        }
        // 优化stop
        shouldTrack = true;
        activeEffect = this;
        const res = this._fn()
        shouldTrack = false;
        return res
    }
    stop() {
        // deps是set
        if (this.active) {
            cleanEffect(this)
            if (this.onStop) {
                this.onStop()
            }
            this.active = false
        }
    }
}

function cleanEffect(effect) {
    effect.deps.forEach((item: any) => {
        return item.delete(effect)
    })
    effect.deps.length = 0;
}

const targetMap = new Map()
export function track(target, key) {
    // 先存target 再存keye 再得dep
    // isTracking()
    if (!isTracking()) return;
    let depsMap = targetMap.get(target)
    if (!depsMap) {
        depsMap = new Map()
        targetMap.set(target, depsMap)
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set()
        depsMap.set(key, dep)
    }
    TrackEffects(dep)
}
export function isTracking() {
    return shouldTrack && activeEffect !== undefined
};

export function TrackEffects(dep: any) {
    if (!dep.has(activeEffect)) {
        dep.add(activeEffect)
        activeEffect.deps.push(dep)
    }
}
export function trigger(target, key) {
    let depsMap = targetMap.get(target)
    if (!depsMap) return
    let dep = depsMap.get(key)
    // console.log(dep)
    TriggerEffect(dep)
}
export function TriggerEffect(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            // scheduler 可以让用户自己选择调用的时机
            // 这样就可以灵活的控制调用了
            // 在 runtime-core 中，就是使用了 scheduler 实现了在 next ticker 中调用的逻辑
            effect.scheduler()
        } else {
            effect.run()
        }

    }

}
// scheduler需求分析  意思是调度器
// 通过effect第二个参数给一个schedulerfn
// effect第一次执行的时候 还会执行fn
// 当响应式对象set update不会执行fn 而是执行scheduler
// 如何说当runner时候 会再次执行fn  
export function effect(fn, options: any = {}) {
    let scheduler = options.scheduler
    const _effect = new ReactiveEffect(fn, scheduler)
    // Object.assign(_effect, options)
    // _effect.onStop = options.onStop
    extend(_effect, options)
    _effect.run()
    const runner: any = _effect.run.bind(_effect)
    runner.effect = _effect
    return runner
}
// stop功能分析 
// runner 
export function stop(runner) {
    runner.effect.stop()
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