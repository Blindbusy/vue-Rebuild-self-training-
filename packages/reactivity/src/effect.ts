export let activeEffect = undefined; // 存储当前的effect

class ReactiveEffect {
  public deps = [];
  // 反向收集effect关联了哪些属性
  public parent = null;
  public active = true; //实例上新增active属性 默认是激活的
  constructor(public fn) {} // ts的语法，用户传递的参数也会挂到this上
  run() {
    // 此处表示非激活的情况，只执行函数，不进行依赖收集
    if (!this.active) {
      this.fn();
    }

    // 此处进行依赖收集，核心是将effect和当前的渲染关联
    try {
      this.parent = activeEffect;
      activeEffect = this;
      return this.fn();
      // 稍后调用取值操作时，可以获取到全局的activeEffect
    } finally {
      // 即使发生了错误，也重置activeEffect
      this.parent = null;
      activeEffect = this.parent;
    }
  }
}

export function effect(fn) {
  // 这里fn可以根据状态变化，重新执行，effect可以嵌套写
  const _effect = new ReactiveEffect(fn); // 创建响应式的effect
  _effect.run(); // 默认先执行一次
}

// 一个effect对应多个属性，一个属性对应多个effect
// 多对多的关系，需要一个中间结构，来存储这种对应关系
// weakMap = {object:map{name:'effect'}}
const targetMap = new WeakMap();
export function track(target, type, key) {
  debugger;
  if (!activeEffect) return;
  let depsMap = targetMap.get(target); //第一次没有
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }
  let shouldTrack = !dep.has(activeEffect);
  // 如果dep中有没有activeEffect，那么就需要收集了，实现去重
  if (shouldTrack) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep); // 让effect记录dep，稍后清理的时候会用到
  }
  // 对象的某个属性-> 多个effect
  // weakMap={对象：map:{属性：set}}，set实现去重
}

export function trigger(target, type, key, value, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  // 触发的值不在模板中使用，不需要触发
  const effects = depsMap.get(key);
  // effects是一个set类型数据，包含所有与当前属性key相关联的effect
  // 找到对应的effect
  effects &&
    effects.forEach((effect) => {
      if (effect !== activeEffect) {
        // 在执行effect的时候，又要执行自身，那就需要屏蔽掉，不要无限调用
        effect.run();
      }
    });
}
