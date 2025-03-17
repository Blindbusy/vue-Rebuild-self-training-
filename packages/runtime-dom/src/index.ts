import { h } from 'vue';
import { nodeOps } from './nodeOps';
import { patchProp } from './patchProp';
import { createRenderer } from '@vue/runtime-core';
export * from '@vue/runtime-core';

const renderOptions = Object.assign(nodeOps, { patchProp });
// DOM API  属性API

export function render(vnode, container) {
  // 在创建渲染器的时候传入选项
  createRenderer(renderOptions).render(
    h('h1', 'hello'),
    document.getElementById('app')
  );
}
