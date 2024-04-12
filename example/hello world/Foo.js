import { h } from '../../lib/guide-mini-vue.esm.js';
// 为实现props逻辑而设
export const Foo = {
    setup(props, { emit }) {
        console.log(props)
        const emitAdd = () => {
            console.log("emit add")
            emit("add", 1, 2)
        }
        // console.log(props)
        return {
            emitAdd
        }
    },
    render() {
        const btn = h("button", {
            onClick: this.emitAdd
        }, "emitAdd"
        )
        const foo = h("p", {}, "foo")
        return h("div", {}, [foo, btn])
    }
}