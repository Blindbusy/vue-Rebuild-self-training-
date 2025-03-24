export let currentInstance = null;
export const setCurrentInstance = (instance) => {
  currentInstance = instance;
};
export const getCurrentInstance = () => {
  return currentInstance;
};
let instance = {
  appContext: {},
  proxy: {},
};
setCurrentInstance(instance);
// setup()函数部分...未实现
setCurrentInstance(null);
