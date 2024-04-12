export const enum ShapeFlags {
    ELEMENT = 1, // 0001
    STATEFUL_COMPONENT = 1 << 1,   //0010
    TEXT_CHILDREN = 1 << 2,
    //0100
    ARRAY_CHILDREN = 1 << 3,
    //1000
    SLOT_CHILDREN = 1 << 4,
}
// export const ShapeFlags = {
// element: 0,
// Stateful_Component: 0,
// text_child: 0,
// array_child: 0,
// }

// 1可以设值 修改
// ShapeFlags.Stateful_Component = 1;
// ShapeFlags.text_child= 1;
// 2查找
// if(ShapeFlags.element)
// if(ShapeFlags.Stateful_Component)
// 但不够高效    位运算的方式

