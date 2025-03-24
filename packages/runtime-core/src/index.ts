export { createRenderer } from './renderer';
export { h } from './h';
export * from './vnode';
export * from './apiLifeCycle';
export const invokeArrayFns = (fns) => {
  for (let i = 0; i < fns.length; i++) {
    fns[i]();
  }
};
