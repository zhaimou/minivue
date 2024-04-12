import { effect } from '../effect';
import { reactive } from '../reactive';
describe('effect', () => {
    it('happy test', () => {
        const user = reactive({
            age: 10,
        })
        let nextage;
        effect(() => (nextage = user.age + 1))
        expect(nextage).toBe(11);
        user.age++;
        expect(nextage).toBe(12);
    })
})