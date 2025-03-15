import { ReactiveEffect } from 'vue';
import { isReactive } from './reactive';
import { isObject } from '@vue/shared';

export function traversal(value, set = new Set()) {
  // 考虑对象中有循环引用的问题
  // 第一步 递归要有终结的条件，不是对象就不递归
  if (!isObject(value)) {
    return value;
  }
  if (set.has(value)) {
    return value;
  }
  set.add(value); // 防止循环引用，将对象添加到set中
  for (let key in value) {
    // 取值时会触发get，所以需要收集effect
    traversal(value[key], set);
  }
  return value;
}
// source是用户传入的需要监控的数据(getter函数或对象)，cb是用户传入的回调函数
export function watch(source, cb) {
  let getter;
  if (isReactive(source)) {
    // 需要对用户传入的数据进行循环，实现依赖收集
    // 递归循环，访问对象的每一个属性，访问属性时收集effect
    getter = () => traversal(source);
  }
  let cleanup;
  const oncleanup = (fn) => {
    cleanup = fn;
    // 保存用户传入的回调函数
    // 留在下一次触发watch时调用
  };
  let oldValue;
  const job = () => {
    if (cleanup) cleanup();
    // 下一次watch开始触发时，触发上一次watch的清理
    const newValue = effect.run();
    // 数据变化后执行用户传入的回调函数
    cb(newValue, oldValue, oncleanup);
    oldValue = newValue;
    // 这里更新旧值为新值为下一次变化做准备
  };

  const effect = new ReactiveEffect(getter, job);
  // 监控自己构造的函数，变化后重新执行job
  oldValue = effect.run();
}

// watch=effect 内部会保存老值和新值 调用方法
