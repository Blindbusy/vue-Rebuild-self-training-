import { isFunction } from '@vue/shared';
import { ReactiveEffect, trackEffects, triggerEffects } from './effect';

class ComputedRefImpl {
  public effect;
  public _dirty = true; //默认取值时进行计算
  // 缓存依赖于_dirty
  public __v_isReadonly = true;
  public __v_isRef = true;
  public _value;
  public dep = new Set();
  constructor(public getter, public setter) {
    // 将用户的getter放到effect中，这里面会对用户的getter进行依赖收集
    this.effect = new ReactiveEffect(getter, () => {
      // 稍后依赖的属性变化会执行此调度函数
      if (!this._dirty) {
        this._dirty = true;
        // 实现触发更新
        // 当计算属性依赖的响应式数据变化时，通知计算属性重新计算
        triggerEffects(this.dep);
      }
    });
  }
  get value() {
    // 做依赖收集
    trackEffects(this.dep);
    if (this._dirty) {
      //说明该值是脏的，需要重新计算
      this._dirty = false;
      this._value = this.effect.run();
    }
    return this._value;
  }
  set value(newValue) {
    this.setter(newValue);
  }
}

export const computed = (getterOrOptions) => {
  // computed接收两种类型的数据，一种是函数，一种是对象
  // 如果是对象的话有如下格式：{getter,setter}
  // 如果是函数，则该函数就作为getter
  let onlyGetter = isFunction(getterOrOptions);
  // 判断是否为函数
  let getter;
  let setter;
  if (onlyGetter) {
    // 是函数的话就只有getter
    getter = getterOrOptions;
    setter = () => {
      console.warn('no set!');
    };
  } else {
    // 是对象的话就有getter和setter
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
};
