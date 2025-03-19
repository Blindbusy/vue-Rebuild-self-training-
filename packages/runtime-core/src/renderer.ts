import { isString } from '@vue/shared';
import { createVnode, isSameVnode, ShapeFlags } from './vnode';

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

  const normalize = (child) => {
    if (isString(child)) {
      return createVnode(Text, null, child);
    }
    return child;
  };

  function mountChildren(children, container) {
    for (let i = 0; i < children.length; i++) {
      let child = normalize(children[i]);
      patch(null, child, container);
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

  const processText = (n1, n2, container) => {
    if (n1 == null) {
      hostInsert((n2.el = hostCreateText(n2.children)), container);
    } else {
      // 文本变化复用老节点
      const el = (n2.el = n1.el);
      if (n1.children !== n2.children) {
        hostSetText(el, n2.children); // 文本更新
      }
    }
  };

  const processElement = (n1, n2, container) => {
    if (n1 == null) {
      mountElement(n2, container);
    } else {
      // 此处是更新逻辑 也就是Diff算法部分
      // patchElement(n1, n2, container);
    }
  };

  // 核心的patch方法
  const patch = (n1, n2, container) => {
    // n2可能是一个string 是文本
    if (n1 == n2) return;
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1); // 卸载旧的
      n1 = null; // 将n1置空，之后的判断条件就不会进入更新而是创建
    }
    const { type, shapeFlag } = n2;

    switch (type) {
      case Text: // 实际就是将文本包装成对象 方便渲染
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container);
        }
    }

    // if (n1 == null) {
    //   // 初次渲染
    //   // 后续还有组件的初次渲染，目前是元素初始化渲染
    // } else {
    //   // 更新流程 也就是DIFF算法
    // }
  };

  // 卸载dom
  const unmount = (vnode) => {
    hostRemove(vnode.el);
    // 回忆一下，vnode.el用做真实节点的缓存
    // 此处删除掉的是真实节点
  };

  // 渲染过程由传入的renderOptions来实现
  const render = (vnode, container) => {
    if (vnode == null) {
      // 卸载逻辑
      if (container._vnode) {
        // 如果确实渲染过了，那就卸载dom
        unmount(container._vnode);
      }
    } else {
      // 这里既有初始化的逻辑，又有更新的逻辑
      patch(null, vnode, container);
    }
    container._vnode = vnode;
    //  如果当前vnode是空的话
  };
  return {
    render,
  };
}
// 文本的传入，需要自行增加类型
// 因为不能通过document.createElement('文本')创建节点
// 如果传入的是null，则代表要卸载DOM，执行卸载逻辑删除DOM节点
