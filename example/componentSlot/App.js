import { h, createTextVNode } from '../../lib/guide-mini-vue.esm.js';
import { Foo } from './Foo.js'
window.self = null;
export const App = {
    name: "App",
    render() {
        const app = h("div", {}, "App")
        // const foo = h(Foo, {}, h("p", {}, "foo"))
        // const foo = h(Foo, {}, [h("p", {}, "foo"), h("p", {}, "foo1")])
        // 继续优化 需要指定位置随意改元素 数据结构用object key
        const foo = h(Foo, {}, {
            header: ({ age }) => {
                return [h("p", {}, "header" + age),
                createTextVNode("你好啊")
                ]
            },
            footer: ({ age }) => h("p", {}, "footer" + age),
        })
        return h("div", {}, [app, foo])
    },
    setup() {
        return {
        }
    }
}