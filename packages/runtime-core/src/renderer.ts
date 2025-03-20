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

  const normalize = (children, i) => {
    if (isString(children[i])) {
      let vnode = createVnode(Text, null, children[i]);
      children[i] = vnode;
    }
    return children[i];
  };

  function mountChildren(children, container) {
    for (let i = 0; i < children.length; i++) {
      let child = normalize(children, i);
      // 处理后需要替换，否则children中存放的已经是字符串
      patch(null, child, container);
    }
  }

  function mountElement(vnode, container, anchor) {
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
    hostInsert(el, container, anchor);
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

  function patchProps(oldProps, newProps, el) {
    for (let key in newProps) {
      if (key === 'style') {
        hostPatchProp(el, key, oldProps[key], newProps[key]);
        // 完成新样式对已有的样式的覆盖
        // 并添加新增的原来没有的样式
      }
      for (let key in oldProps) {
        // 旧的有新的没有的属性，则删除
        if (newProps[key] == null) {
          hostPatchProp(el, key, oldProps[key], undefined);
        }
      }
    }
  }
  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i]);
    }
  };

  const patchKeyedChildren = (c1, c2, el) => {
    // 比较子节点差异
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    // c1和c2的头指针相同，并且有各自的尾指针
    while (i <= e1 && i <= e2) {
      // 从头开始依次匹配
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVnode(n1, n2)) {
        // 有任何一方的指针越界，就停止循环
        patch(n1, n2, el); // 比较两个节点的属性和子节点
      } else {
        break;
      }
      i++;
    }
    while (i <= e1 && i <= e2) {
      // 从尾开始依次匹配
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVnode(n1, n2)) {
        // 有任何一方的指针越界，就停止循环
        patch(n1, n2, el); // 比较两个节点的属性和子节点
      } else {
        break;
      }
      e1--;
      e2--;
    }
    // 有一方全部比较完了，要么添加，要么删除
    // i比e1大，说明c1已经遍历完了，c2还有剩余，要新增
    // i和e2中间的部分是新增的部分
    if (i > e1) {
      if (i <= e2) {
        // 说明c1已经遍历完了，c2还有剩余
        // 此时需要把c2剩余的部分插入到el中
        while (i <= e2) {
          const nextPos = e2 + 1;
          const anchor = nextPos < c2.length ? c2[nextPos].el : null;
          patch(null, c2[i], el, anchor); //创建新节点，放到容器中
          i++;
        }
      }
    } else if (i > e2) {
      // 卸载部分
      if (i <= e1) {
        while (i <= e1) {
          unmount(c1[i]);
          i++;
        }
      }
    }
  };

  const patchChildren = (n1, n2, el) => {
    // 比较两个虚拟节点的孩子的差异，el为当前的父节点
    const c1 = n1.children;
    const c2 = n2.children;
    const prevShapeFlag = n1.shapeFlag; // 之前的
    const shapeFlag = n2.shapeFlag; // 现在的
    // 孩子可能是 文本 null 数组
    // 下面比较两个孩子的差异 Diff算法
    // 子元素的比较情况：
    // 新         旧         操作方式
    // 文本       数组       删除旧的，设置新文本内容
    // 文本       文本       更新文本内容
    // 文本       null      同上
    // 数组       数组       Diff算法 比较复杂
    // 数组       文本       删除旧的，挂载新的
    // 数组       null       同上
    // null       数组       删除所有子节点
    // null       文本       清空文本
    // null       null      不做任何操作
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 旧的是数组，现在是文本
        unmountChildren(n1.children);
        // 文本       数组       删除旧的，设置新文本内容
      }
      if (c1 !== c2) {
        hostSetElementText(el, c2);
        // 文本       文本       更新文本内容
        // 文本       null      同上
      }
    } else {
      // 现在是数组或者空
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 数组       数组       Diff算法 比较复杂
          patchKeyedChildren(c1, c2, el);
        } else {
          // null       数组       删除所有子节点
          unmountChildren(c1);
        }
      } else {
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          // 数组       文本       删除旧的，挂载新的
          // null       文本       清空文本
          hostSetElementText(el, '');
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el);
          // 数组       文本       删除旧的，挂载新的
        }
      }
    }
  };

  const patchElement = (n1, n2) => {
    // 先复用节点、再比较属性、再比较孩子节点
    let el = (n2.el = n1.el);
    let oldProps = n1.props || {};
    let newProps = n2.props || {};
    patchProps(oldProps, newProps, el);
    patchChildren(n1, n2, el);
  };

  const processElement = (n1, n2, container, anchor) => {
    if (n1 == null) {
      mountElement(n2, container, anchor);
    } else {
      // 此处是更新逻辑 也就是Diff算法部分
      patchElement(n1, n2);
    }
  };

  // 核心的patch方法
  function patch(n1, n2, container, anchor = null) {
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
          processElement(n1, n2, container, anchor);
        }
    }

    // if (n1 == null) {
    //   // 初次渲染
    //   // 后续还有组件的初次渲染，目前是元素初始化渲染
    // } else {
    //   // 更新流程 也就是DIFF算法
    // }
  }

  // 卸载dom
  function unmount(vnode) {
    hostRemove(vnode.el);
    // 回忆一下，vnode.el用做真实节点的缓存
    // 此处删除掉的是真实节点
  }

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
