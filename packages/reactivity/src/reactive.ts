import { isObject } from '@vue/shared';

// 1.将数据转换成响应式数据,只能做对象类型数据的代理
const reactiveMap = new WeakMap(); //key只能是对象类型
const enum ReactiveFlags { //响应式标识
  // 实现同一个对象代理多次，返回同一个代理对象
  // 代理对象的代理对象还是之前的代理对象
  IS_REACTIVE = '__v_isReactive',
}
export function reactive(target) {
  if (isObject(target)) {
    return;
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
  // 下一次传入proxy对象，为了检测是否代理过，可以查看是否有get方法，有的话说明被proxy代理过

  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      // 去代理对象上取值 使用get
      // return target[key];  这种方式this指向有问题
      console.log(key);
      // 可以监控到用户取值
      return Reflect.get(target, key, receiver);
      // Proxy要配合Reflect使用，保证this指向正确
      // Reflect的recerver参数使this指向代理对象
    },
    set(target, key, value, receiver) {
      // 去代理上设置值 使用set
      // target[key] = value;
      // 可以监控到用户设置值
      return Reflect.set(target, key, value, receiver);
    },
  });
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
// // 并没有重新定义属性，只是代理，在取值的时候会调用get，赋值时会调用set
// const proxy = new Proxy(target, {
//   get(target, key, receiver) {
//     // 去代理对象上取值 使用get
//     // return target[key];  这种方式this指向有问题
//     console.log(key);
//     return Reflect.get(target, key, receiver);
//     // Proxy要配合Reflect使用，保证this指向正确
//     // Reflect的recerver参数使this指向代理对象
//   },
//   set(target, key, value, receiver) {
//     // 去代理上设置值 使用set
//     // target[key] = value;
//     // return true;
//     return Reflect.set(target, key, value, receiver);
//   },
// });
