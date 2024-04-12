import { NodeType } from "./ast"
const enum TagType {
    Start,
    End,
}
export function baseParse(content: string) {
    const context = createParserContext(content)
    return createRoot(parseChildren(context))
}
function parseChildren(context) {
    const nodes: any = []
    while (!isEnd(context)) {
        let node
        const s = context.source
        if (s.startsWith("{{")) {
            node = parseInterpolation(context)
        } else if (s[0] === "<") {
            if (/[a-z]/i.test(s[1])) {
                node = parseElement(context)
            }
        }
        if (!node) {
            node = parseText(context)
        }
        nodes.push(node)
    }
    return nodes
}
function isEnd(context) {
    const s = context.source
    console.log(s)
    if (s.startsWith("</")) {
        return true
    }
    return !context.source
}
function parseInterpolation(context) {
    const openDelimiter = "{{"
    const closeDelimiter = "}}"
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length)
    // console.log(closeIndex)
    context.source = context.source.slice(openDelimiter.length)
    const rawContentLength = closeIndex - openDelimiter.length
    const rawContent = context.source.slice(0, rawContentLength)
    const content = rawContent.trim()
    context.source = context.source.slice(context, closeDelimiter.length)
    return {
        type: NodeType.INTERPOLATION,
        content: {
            type: NodeType.SIMPLE_EXPRESSION,
            content: content
        }

    }
}

function parseElement(context: any) {

    const element: any = parseTag(context, TagType.Start)
    console.log(element)
    // element.children = parseChildren(context)
    parseTag(context, TagType.End)
    return element
}

function parseTag(context, type: TagType) {
    const match: any = /^<\/?([a-z]*)/i.exec(context.source)
    const tag = match[1];
    context.source = context.source.slice(context, match[0].length)
    context.source = context.source.slice(context, 1)
    if (type === TagType.End) return;
    return {
        type: NodeType.ELEMENT,
        tag,
    }
}
function parseText(context: any): any {
    let endIndex = context.source.length
    let endToken = "{{"
    let index = context.source.indexOf(endToken)
    if (index !== -1) {
        endIndex = index
    }
    const content = context.source.slice(0, endIndex)
    //  推进
    context.source = context.source.slice(context, content.length)

    return {
        type: NodeType.TEXT,
        content
    }
}


function createRoot(children) {
    return {
        children,
    }
}

function createParserContext(content: string): any {
    return {
        source: content
    }
}

function advanceBy(context, numberOfCharctrt) {

}