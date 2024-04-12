import { getCurrentInstance } from "./component";

export function provide(key, value) {
    // 存
    const CurrentInstance: any = getCurrentInstance()
    // console.log(CurrentInstance)
    if (CurrentInstance) {
        let { provides } = CurrentInstance
        const parentProvides = CurrentInstance.parent.provides
        // 让他在执行一次后不再执行
        if (provides === parentProvides) {
            provides = CurrentInstance.provides = Object.create(parentProvides)
        }
        provides[key] = value
    }


}
export function inject(key, defaultValue) {
    const CurrentInstance: any = getCurrentInstance()
    if (CurrentInstance) {
        // const { parent } = CurrentInstance
        const parentProvides = CurrentInstance.parent.provides
        if (key in parentProvides) {
            return parentProvides[key]
        } else if (defaultValue) {
            if (typeof defaultValue === "function") {
                defaultValue()
            }
            return defaultValue
        }
    }

}