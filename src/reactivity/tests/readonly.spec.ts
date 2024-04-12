import { isReadonly, readonly } from '../reactive';
describe("readonly", () => {

    it("happy path", () => {
        const original = { foo: 1, bar: { bar1: 2 } }
        const origin = readonly(original)
        expect(original).not.toBe(origin)
        // expect()  
        // origin.foo = 2
        // expect(origin.foo).toBe(1)
        expect(isReadonly(origin)).toBe(true)
        expect(isReadonly(original)).toBe(false)

    })
    it("warn then call set ", () => {
        console.warn = jest.fn()
        const user = readonly({
            name: 'zhaimou',
        })
        user.name = 'zhaimou2';
        expect(console.warn).toBeCalled()

    })

})