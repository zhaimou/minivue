import { createRender } from '../../lib/guide-mini-vue.esm.js';
import { App } from './App.js';

// console.log(PIXI)
const game = new PIXI.Application({
    width: 500,
    height: 500,
})
document.body.append(game.view)

const renderer = createRender({
    createElement(type) {
        const rect = new PIXI.Graphics()
        rect.beginFill(0xff0000)
        rect.drawRect(0, 0, 100, 100);
        rect.endFill()
        return rect
    },
    patchProp(el, key, val) {
        el[key] = val
    },
    insert(key, parent) {
        parent.addChild(key)
    }

})
renderer.createApp(App).mount(game.stage)
// const rootContainer = document.querySelector("#app")
// createApp(app).mount(rootContainer)
