export function patchStyle(el, prevValue, nextValue) {
  for (let key in nextValue) {
    // 用新的直接覆盖
    el.style[key] = nextValue[key];
  }
  if (prevValue) {
    // 如果有旧值则遍历旧值，并对比新值，如果新值没有，则删除旧值
    for (let key in prevValue) {
      if (nextValue[key] == null) {
        el.style[key] = '';
      }
    }
  }
}
