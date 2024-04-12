import { Fragment, createVNode } from "./vNode";


export function renderSlots(slots, name, props) {
    const slot = slots[name]
    if (slot) {
        if (typeof slot === "function") {
            // 这样做会多一层div
            return createVNode(Fragment, {}, slot(props))
        }
    }
}


