import { isReactive, reactive } from '../reactive';
describe('reactive', () => {
    it('happy path', () => {
        const original = { user: 10 };
        const original1 = reactive(original);
        expect(original).not.toBe(original1)
        expect(original1.user).toBe(10)
        expect(isReactive(original1)).toBe(true)
        expect(isReactive(original)).toBe(false)
    })
}
)
