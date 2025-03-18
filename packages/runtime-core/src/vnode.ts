import { isArray, isString } from '@vue/shared';

export function isVnode(value) {
  return !!(value && value.__v_isVnode); //双叹号强制转换布尔类型
}
// 虚拟节点有很多种类：组件的、元素的、文本的...
export function createVnode(type, props, children = null) {
  // 组合方案 shapeFlag 要判断一个元素中包含一个子元素还是多个子元素
  let shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0;
  // 虚拟DOM是一个对象，DIFF算法 使用真实DOM的话属性比较多，虚拟DOM只需要比较属性的差异
  const vnode = {
    // vnode也就是虚拟节点
    type,
    props,
    children,
    el: null, // 虚拟节点上对应的真实节点，后续DIFF算法会用到
    key: props?.['key'],
    __v_isVnode: true,
    shapeFlag,
  };
  if (children) {
    let type = 0;
    if (isArray(children)) {
      type = ShapeFlags.ARRAY_CHILDREN;
    } else {
      children = String(children);
      type = ShapeFlags.TEXT_CHILDREN;
    }
  }
}

export const enum ShapeFlags { // vue3提供的形状标识
  ELEMENT = 1,
  FUNCTIONAL_COMPONENT = 1 << 1,
  STATEFUL_COMPONENT = 1 << 2,
  TEXT_CHILDREN = 1 << 3,
  ARRAY_CHILDREN = 1 << 4,
  SLOTS_CHILDREN = 1 << 5,
  TELEPORT = 1 << 6,
  SUSPENSE = 1 << 7,
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
  COMPONENT_KEPT_ALIVE = 1 << 9,
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT,
}
