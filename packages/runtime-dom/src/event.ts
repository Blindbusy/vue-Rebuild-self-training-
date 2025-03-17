function createInvoker(callback) {
  const invoker = (e) => invoker.value(e);
  invoker.value = callback;
  // value用于保存传入的事件回调
  // 此时调用invoker，实际上调用的是invoker.value
  // 这样免去了每次都要重新创建函数的开销
  return invoker;
}

export function patchEvent(el, eventName, nextValue) {
  let invokers = el._vei || (el._vei = {});
  // invokers用于缓存事件
  let exists = invokers[eventName];
  // 先看有没有缓存过
  if (exists && nextValue) {
    // 已经绑定过事件了
    exists.value = nextValue;
    // 直接通过`.value`更新事件回调
  } else {
    // 未绑定事件
    // 首先对事件名作处理
    // 事件名：onClick -> click
    let event = eventName.slice(2).toLowerCase();
    if (nextValue) {
      const invoker = (invokers[eventName] = createInvoker(nextValue));
      // 绑定事件并放入缓存
      el.addEventListener(event, invoker);
    } else if (exists) {
      // 如果有旧值，需要移除旧的事件绑定
      el.removeEventListener(event, exists);
      // 移除事件
      invokers[eventName] = undefined;
      // 清空缓存
    }
  }
}
