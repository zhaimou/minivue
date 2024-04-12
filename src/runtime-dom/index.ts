import { createRender } from '../runtime-core';

function createElement(type) {
    return document.createElement(type)
}
function patchProp(el, key, prevVal, nextVal) {
    const isOn = (key: string) => /^on[A-Z]/.test(key)
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase()
        el.addEventListener(event, nextVal)
    } else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key)
        } else {
            el.setAttribute(key, nextVal)
        }
    }
}
function insert(child, parent, anchor = null) {
    // parent.append(el)
    // console.log('insert')
    // console.log("anchor", anchor)
    // console.log("child:", child)
    // if (parent.contains(anchor)) {

    //     console.log("zailimai:", child)
    // }
    // console.log(parent)
    // console.log(parent.lastElementChild)
    // if (!anchor) {
    parent.insertBefore(child, anchor)
    // } else {
    // parent.lastElementChild.insertBefore(child, anchor)
    // }

}
function remove(child) {
    const parent = child.parentNode
    if (parent) {
        parent.removeChild(child)
    }
}
function setElementText(el, text) {
    el.textContent = text
}
const render: any = createRender({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText
}
)


export function createApp(...args) {
    return render.createApp(...args)
}

export * from '../runtime-core/index'