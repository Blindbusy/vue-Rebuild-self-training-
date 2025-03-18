import { ShapeFlags } from './vnode';

export function createRenderer(renderOptions) {
  let {
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
    setText: hostSetText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    createElement: hostCreateElement,
    createText: hostCreateText,
    patchProp: hostPatchProp,
  } = renderOptions;

  function mountChildren(children, container) {
    for (let i = 0; i < children.length; i++) {
      patch(null, children[i], container);
    }
  }

  function mountElement(vnode, container) {
    // 传入虚拟节点和真实元素 把虚拟节点的属性、类型...挂载到真实DOM上
    let { type, props, children, shapeFlag } = vnode;
    let el = (vnode.el = hostCreateElement(type));
    // 1.创造真实元素
    // 将真实元素挂载到虚拟节点的el属性上，后续复用节点更新时会用到
    // 也就是缓存一下
    if (props) {
      for (let key in props) {
        // 遍历并添加属性
        hostPatchProp(el, key, null, props[key]);
      }
    }
    // 2.处理子节点
    // 子节点有两种情况：1.文本 2.数组
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 文本
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 数组
      mountChildren(children, el);
      // 将每个孩子都挂载到自己的el上
      // 注意此处是递归挂载
    }
    // 3.将元素插入到容器中 完成初始化渲染
    hostInsert(el, container);
  }
  // 核心的patch方法
  const patch = (n1, n2, container) => {
    // n2可能是一个string 是文本
    if (n1 == n2) return;
    if (n1 == null) {
      // 初次渲染
      // 后续还有组件的初次渲染，目前是元素初始化渲染
      mountElement(n2, container);
    } else {
      // 更新流程
    }
  };
  // 渲染过程由传入的renderOptions来实现
  const render = (vnode, container) => {
    if (vnode == null) {
      // 卸载逻辑
    } else {
      // 这里既有初始化的逻辑，又有更新的逻辑
      patch(null, vnode, container);
    }
    container._vnode = vnode;
  };
  return {
    render,
  };
}
