export let activeEffect = undefined; // 存储当前的effect

function cleanupEffect(effect) {
  const { deps } = effect; //deps中装的是响应式数据对应的effect
  for (let i = 0; i < deps.length; i++) {
    deps[i].delete(effect); //解除effect重新收集
  }
  // 此处需要注意，上述繁琐的遍历是为了清除deps中存储的多个set中的依赖
  // 因为deps本身是一个数组，存储的是多个set的 **引用**
  // 所以需要遍历来清除各个set对应的内存上的数据
  // 不可以直接用： effect.deps=[] 来代替
  // 如果直接这样做，effect.deps这个数组确实空了，但是set里的内容依然在
  // 等于内存泄漏
  effect.deps.length = 0; //清空effect中的响应式数据
}

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

      // 这里我们需要在执行用户函数之前将已有的收集清空

      cleanupEffect(this); //这里清理完了马上又开始收集，死循环了
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
  // targetMap target:Map(depsMap)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  //depsMap key:set(dep)
  // dep set(effect的集合)
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
// --effect是vue一个非常核心的api，它是compute、watch、组件...的基础
// 1)我们先搞了一个响应式对象通过new Proxy实现
// 2)effect默认数据变化要能够更新，我们现将正在执行的effect作为全局变量存储，渲染（取值），然后在get方法中收集依赖
// 3)定义关联响应式数据和依赖的数据结构 (对象<-->键值<-->依赖) WeakMap（对象：Map（键值：set（存储依赖）））
// 4)稍后用户数据发生变化时，会通过对象的属性来查找对应的effect集合(set类型数据)，找到后全部执行
