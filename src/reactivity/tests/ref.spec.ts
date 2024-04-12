import { effect } from "../effect";
import { reactive } from "../reactive";
import { isRef, proxyRefs, ref, unRef } from "../ref";
describe('ref', () => {
    it("happy path", () => {
        const a = ref(1)
        expect(a.value).toBe(1)
    })
    it("should be reactive", () => {
        const ab = ref(1)
        let dummy;
        let calls = 0;
        effect(() => {
            calls++;
            dummy = ab.value;
        })
        expect(calls).toBe(1)
        expect(dummy).toBe(1)
        // ab.value = 2;
        // expect(calls).toBe(2)
        // expect(dummy).toBe(2)
        // 一样的值不触发trigger
        // ab.value = 2;
        // expect(calls).toBe(2)
        // expect(dummy).toBe(2)
    })
    it("isRef", () => {
        const a = ref(1)
        const user = reactive({
            age: 1
        })
        expect(isRef(a)).toBe(true)
        expect(isRef(1)).toBe(false)
        expect(isRef(user)).toBe(false)
    })
    it("unRef", () => {
        const a = ref(1)
        const user = reactive({
            age: 1
        })
        expect(unRef(a)).toBe(1)
        expect(unRef(1)).toBe(1)
    })
    it("ProxyRefs", () => {
        const user = {
            age: ref(10),
            name: "xiaohong",
        }
        const ProxyUser = proxyRefs(user)
        expect(user.age.value).toBe(10)
        expect(ProxyUser.age).toBe(10)
        expect(ProxyUser.name).toBe('xiaohong')
    })
})