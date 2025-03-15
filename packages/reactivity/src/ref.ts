import { isObject } from '@vue/shared';
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
