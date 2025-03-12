import { isObject } from '@vue/shared';
import { reactive } from './reactive';
import { activeEffect, track, trigger } from './effect';

export const enum ReactiveFlags { //响应式标识
  // 实现同一个对象代理多次，返回同一个代理对象
  // 代理对象的代理对象还是之前的代理对象
  IS_REACTIVE = '__v_isReactive',
}

export const mutableHandlers = {
  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }

    track(target, 'get', key);
    // 去代理对象上取值 使用get
    // return target[key];  这种方式this指向有问题
    console.log(key);
    // 可以监控到用户取值
    const value = Reflect.get(target, key, receiver);
    // 如果获取的值是对象，递归调用 reactive 函数将其转换为响应式对象
    if (isObject(value)) {
      return reactive(value);
    }
    return value;
    // Proxy要配合Reflect使用，保证this指向正确
    // Reflect的recerver参数使this指向代理对象
  },
  set(target, key, value, receiver) {
    // 去代理上设置值 使用set
    let oldValue = target[key];
    let result = Reflect.set(target, key, value, receiver);
    if (oldValue !== value) {
      // 触发effect,更新
      trigger(target, 'set', key, value, oldValue);
    }
    // 可以监控到用户设置值
    return Reflect.set(target, key, value, receiver);
  },
};
