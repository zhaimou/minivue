import { NodeType } from "../src/ast"
import { baseParse } from "../src/parse"

// describe("parse", () => {
//     describe("interpolation", () => {
//         test("simple interpolation", () => {
//             const ast = baseParse("{{message}}")
//             expect(ast.children[0]).toStrictEqual({
//                 type: NodeType.INTERPOLATION,
//                 content: {
//                     type: NodeType.SIMPLE_EXPRESSION,
//                     content: "message"
//                 }
//             })

//         })
//     });
//     describe("element", () => {
//         it("simple element div", () => {
//             const ast = baseParse("<div><div>")
//             expect(ast.children[0]).toStrictEqual({
//                 type: NodeType.ELEMENT,
//                 tag: "div",
//             })
//         })
//     })
//     describe("text", () => {
//         it("simple text", () => {
//             const ast = baseParse("some text")
//             expect(ast.children[0]).toStrictEqual({
//                 type: NodeType.TEXT,
//                 content: "some text"
//             })
//         })
// })

//     test.only("hello world", () => {
//         const ast = baseParse("<div>hi,{{message}}</div>")
//         const element = ast.children[0];
//         expect(element).toStrictEqual({
//             type: NodeType.ELEMENT,
//             tag: "div",
//             children: [
//                 {
//                     type: NodeType.TEXT,
//                     content: "hi,"
//                 },
//                 {
//                     type: NodeType.SIMPLE_EXPRESSION,
//                     content: "message"
//                 }
//             ]

//         })
//     })
// })