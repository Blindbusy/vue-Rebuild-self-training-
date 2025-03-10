const args = require('minimist')(process.argv.slice(2)); //node scripts/dev.js reactivity -f global
const { resolve } = require('path'); // node内置模块
// minist 用来解析命令行参数
const { build } = require('esbuild'); // 打包工具

const target = args._[0] || 'reactivity';
const format = args.f || 'global';

// 开发环境只打包一个
const pkg = require(resolve(__dirname, `../packages/${target}/package.json`));

// iife 立即执行函数 (function(){})()
// cjs node中的模块 module.exports
// esm 浏览器中的esModule模块 import
const outputFormat = format.startsWith('global')
  ? 'iife'
  : format === 'cjs'
  ? 'cjs'
  : 'esm';

const outfile = resolve(
  __dirname,
  `../packages/${target}/dist/${target}.${format}.js`
);

// 天生支持ts
build({
  entryPoints: [resolve(__dirname, `../packages/${target}/src/index.ts`)],
  outfile,
  bundle: true, //所有包打包在一起
  sourcemap: true,
  format: outputFormat, // 输出格式
  globalName: pkg.buildOptions?.name, // 打包的全局名字
  platform: format === 'cjs' ? 'node' : 'browser', // 运行平台
  // watch: {
  //   onRebuild(error) {
  //     if (!error) console.log(`rebuilt~~~~~`);
  //   },
  // },
}).then(() => {
  console.log('watching~~~~~');
});
