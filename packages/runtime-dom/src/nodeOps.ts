export const nodeOps = {
  // 实现增删改查
  createElement(tagName) {
    // 创建指定标签节点
    return document.createElement(tagName);
  },
  createText(text) {
    // 创建文本节点
    return document.createTextNode(text);
  },
  insert(child, parent, anchor = null) {
    //插入
    parent.insertBefore(child, anchor);
    // insertBefore可以等价于appendChild
  },
  remove(child) {
    // 删除
    const parentNode = child.parentNode;
    if (parentNode) {
      parentNode.removeChild(child);
    }
  },
  // 修改,此处修改只有两种情况：1.修改DOM内文本内容 2.修改文本节点
  setElementtext(el, text) {
    // 修改文本内容
    el.textContent = text;
  },
  setText(text, node) {
    // 修改文本节点
    node.nodeValue = text;
  },
  // 查询
  querySelector(selector) {
    // 根据选择器查询
    return document.querySelector(selector);
  },
  parentNode(node) {
    // 查询父节点
    return node.parentNode;
  },
  nextSibling(node) {
    // 查询兄弟节点
    return node.nextSibling;
  },
};
