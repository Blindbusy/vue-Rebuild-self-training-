import { currentInstance, setCurrentInstance } from './components';
export const enum LifeCycleHooks {
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u',
}

function createHook(type) {
  return (hook, target = currentInstance) => {
    // hook需要绑定到对应的实例上
    if (target) {
      // 关联currentInstance和hook
      const hooks = target[type] || (target[type] = []);
      const warpedHook = () => {
        setCurrentInstance(target);
        hook(); // 将当前的实例保存到全局curentInstance上，形成闭包
        setCurrentInstance(null);
      };
      hooks.push(warpedHook); // 稍后执行hook的时候，会拿到当前的实例
    }
  };
}
// 工厂模式
export const onBeforeMount = createHook(LifeCycleHooks.BEFORE_MOUNT);
export const onMounted = createHook(LifeCycleHooks.MOUNTED);
export const onBeforeUpdate = createHook(LifeCycleHooks.BEFORE_UPDATE);
export const onUpdated = createHook(LifeCycleHooks.UPDATED);
