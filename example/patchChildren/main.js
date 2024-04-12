// import { createApp } from "../../dist/mini-vue.esm-bundler.js";
import { createApp } from "../../lib/guide-mini-vue.esm.js";
import App from "./App.js";

const rootContainer = document.querySelector("#root");
createApp(App).mount(rootContainer);
