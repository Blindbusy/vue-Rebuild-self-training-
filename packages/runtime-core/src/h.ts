// h的用法 h（‘div’）
// h('div',{style:{"color": "red"}},'hello')
// h('div','hello')
// h('div',null,'hello','world')

import { isArray, isObject } from '@vue/shared';
import { createVnode, isVnode } from './vnode';

// 接收的参数有：类型、属性、孩子
// （前三个参数之外传入的都一定是孩子，vue支持传入关于孩子的数组）
export function h(type, propsChildren, children) {
  const l = arguments.length; // 获取传入的参数的个数

  // h('div',{style:{"color": "red"}}) 1.是对象 不是数组
  // h('div',h('span')) 1.1是虚拟节点
  // h('div',[h('span'),h('span')]) 2.是数组
  // h('div','hello') （2.是文本）
  // 上述4种对应l===2的情况
  if (l == 2) {
    // 关于将孩子包装成数组的原因在于元素可以循环创建 注意文本不需要包装
    if (isObject(propsChildren) && !isArray(propsChildren)) {
      // 1.是对象 不是数组
      if (isVnode(propsChildren)) {
        // 1.1虚拟节点包装成数组
        return createVnode(type, null, [propsChildren]);
      }
      return createVnode(type, propsChildren); // 1.2属性
    } else {
      return createVnode(type, null, propsChildren); // 2.是数组或文本
    }
  } else {
    if (l > 3) {
      // 3个参数以上,从第三个开始的全部是孩子
      children = Array.from(arguments).slice(2);
    } else if (l === 3 && isVnode(children)) {
      // h('div',{},h('span')) 此处特判
      // 3个参数
      children = [children];
    }
    // 其他
    return createVnode(type, propsChildren, children);
    // children的情况有两种：1.是数组 2.是文本
    // 数组可以循环创建
    // 文本不需要循环创建 直接innerHTML
  }
}
