import { isArray, isObject } from '@vue/shared';
import { reactive } from './reactive';
import { trackEffects, triggerEffects } from './effect';

function toReactive(value) {
  // 判断传入的数据是不是对象
  // 如果是对象则将其转换为响应式对象
  // 否则直接返回
  return isObject(value) ? reactive(value) : value;
}

class RefImpl {
  public dep = new Set();
  private _value; // 就是使用时的`variable.value`的值
  public __v_isRef = true; // 标识当前对象是一个ref对象
  constructor(public rawValue) {
    // rawValue是用户传入的原始数据
    this._value = toReactive(rawValue);
  }
  // 此处和computed的操作一样，使用trackEffects和triggerEffects
  get value() {
    // 追踪依赖
    trackEffects(this.dep);
    return this._value;
  }
  set value(newValue) {
    // 此处需要判断新值和旧值是否相等
    // 如果相等则不需要触发更新
    if (newValue !== this.rawValue) {
      this._value = toReactive(newValue);
      this.rawValue = newValue;
      // 更新旧值
      triggerEffects(this.dep);
      // 触发依赖更新
    }
  }
}

export function ref(value) {
  // 接受一个数据，将其包裹成响应式对象
  return new RefImpl(value);
}

class ObjectRefImpl {
  //仅仅将`.value`属性代理到原始类型上
  constructor(public object, public key) {}
  get value() {
    return this.object[this.key];
  }
  set value(newValue) {
    this.object[this.key] = newValue;
  }
}

// toRef本质上实现了一个代理
export function toRef(object, key) {
  return new ObjectRefImpl(object, key);
}

// toRefs主要就是为了实现解构出来的数据依旧可以实现响应式
// 为了应对直接解构reactive数据时丧失响应式的问题
// 注意，直接解构ref类型对象或数组时也会丧失响应式
// 因为ref底层还是通过reactive实现的
export function toRefs(object) {
  // 数组和对象都可以
  // 此处作判断
  const result = isArray(object) ? new Array(object.length) : {};
  // 此处遍历result，无论是对象还是数组
  for (let key in object) {
    // 此处为空的result添加属性，需要使用代理
    // 否则就会直接在源对象上取值，没有实现响应式的效果
    result[key] = toRef(object, key);
  }
  return result;
}

// 为了实现在模板中可以不用添加`.value`的操作
export function proxyRefs(object) {
  return new Proxy(object, {
    get(target, key, receiver) {
      // 此处判断如果是ref类型对象，就返回其value属性
      // 否则就返回原始值
      let r = Reflect.get(target, key, receiver);
      // 再次强调，reflect是为了保证this指向正确
      return r.__v_isRef ? r.value : r;
      // 此处判断如果是ref类型对象，就返回其`.value`
      // 否则就返回原始值
    },
    set(target, key, value, receiver) {
      // 此处判断如果是ref类型对象，就将其value属性设置为新值
      let oldValue = target[key];
      if (oldValue.__v_isRef) {
        // 此处也判断是否为ref类型
        oldValue.value = value;
        return true;
      } else {
        return Reflect.set(target, key, value, receiver);
      }
    },
  });
}
