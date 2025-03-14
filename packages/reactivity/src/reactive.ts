import { isObject } from '@vue/shared';
import { mutableHandlers, ReactiveFlags } from './baseHandler';

// 1.将数据转换成响应式数据,只能做对象类型数据的代理
const reactiveMap = new WeakMap(); //key只能是对象类型

export function isReactive(value) {
  return !!(value && value[ReactiveFlags.IS_REACTIVE]);
}

export function reactive(target) {
  if (!isObject(target)) {
    return target;
  }
  if (target[ReactiveFlags.IS_REACTIVE]) {
    //如果target是代理对象，那么它一定会在这一步中进入get
    return target; // 判定为代理对象，直接返回，对应多重代理问题
  }

  // 并没有重新定义属性，只是代理，在取值的时候会调用get，赋值时会调用set
  let existingProxy = reactiveMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  // 第一次普通对象代理，会通过new Proxy代理一次
  // 下一次传入proxy对象，为了检测是否代理过，可以查看是否有get方法，有的话说明被proxy代理

  const proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
}

// ---------------------------------------------------------------------
// let target = {
//   name: '123',
//   get alias() {
//     console.log(this);
//     return this.name;
//   },
// };
// let proxy = reactive(target);
// proxy.alias;
