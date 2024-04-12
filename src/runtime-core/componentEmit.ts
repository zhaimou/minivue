export function emit(instance, event, ...args) {
    // console.log()a
    // instanceof.props 中有没有event
    const { props } = instance
    // TPP
    // add -> Add
    const capitalize = (event: string) => {
        return event.charAt(0).toUpperCase() + event.slice(1)
    }
    const toHavelerKey = (str: string) => {
        return str ? "on" + capitalize(str) : "";
    }
    const camelize = (str: string) => {
        return str.replace(/-(\w)/g, (_, c: string) => {
            return c ? c.toUpperCase() : ""
        })
    }
    const handler = props[toHavelerKey(camelize(event))]
    handler && handler(...args)
}