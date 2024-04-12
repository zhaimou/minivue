import { h } from '../../lib/guide-mini-vue.esm.js';
import { Foo } from './Foo.js'
window.self = null;
export const App = {
    name: "App",
    render() {
        window.self = this;
        return h("div", {}, [h("div", {}, "App"), h(Foo, {
            onAdd(a, b) {
                console.log("onAdd")
            }
        },)])
        //  h("div",
        // {
        //     id: "root",
        //     class: ["red", "hard"],
        //     onClick: () => {
        //         console.log("click")
        //     }

        // }, [
        // h("div", {}, "hi," + this.msg),
        // h(Foo, { count: 1 },)
        // ]
        // "hi+" + this.msg
        // vNode.childreng为string类型时
        // "hi, my minivue" + this.msg
        // vNode.childreng为Array类型时
        // [h("p", { class: "red" }, "hi"), h("p", { class: "blue" }, "minivue")]
        // )
        // debugger;
    },
    setup() {
        return {
            msg: "mini-vue"
        }
    }
}