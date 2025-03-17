import { patchAttr } from './attr';
import { patchClass } from './class';
import { patchEvent } from './event';
import { patchStyle } from './style';

// DOM属性的操作
export function patchProp(el, key, prevValue, nextValue) {
  // 类名 el.className
  if (key === 'class') {
    patchClass(el, nextValue);
  }
  // 样式 el.style
  else if (key === 'style') {
    patchStyle(el, prevValue, nextValue);
  }
  // 事件 events addEventListener
  else if (/^on[^a-z]/.test(key)) {
    patchEvent(el, key, nextValue);
  }
  // 普通属性 el.setAttribute
  else {
    patchAttr(el, key, nextValue);
  }
}
// 虚拟DOM
// 如何创建真实DOM
// DOM-diff算法
// 组件的实现 模板渲染 核心组件更新 组件...
// 模版编译原理 + 代码转换 + 代码生成 + （编译优化）
