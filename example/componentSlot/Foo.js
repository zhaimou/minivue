import { h, renderSlots } from '../../lib/guide-mini-vue.esm.js';

export const Foo = {
    setup() {
        return {}
    },
    render() {
        // 获取Foo .vnode .children
        const foo = h("p", {}, "foo")
        // console.log(this.$slots)
        // return h("div", {}, [foo, this.$slots])
        // return h("div", {}, [foo, renderSlots(this.$slots)])
        // 要获取到渲染元素的位置
        // 3. 作用域插槽
        const age = 18
        return h("div", {}, [
            renderSlots(this.$slots, "header", {
                age
            }),
            foo,
            renderSlots(this.$slots, "footer", {
                age
            })])
    }
}