import { NodeTypes } from './ast';

function createParserContext(template) {
  return {
    originalSource: template,
    source: template, // 此字段会被不断解析
    line: 1,
    column: 1,
    offset: 0,
  };
}

function isEnd(context) {
  const source = context.source;
  return !source;
}

function getCursor(context) {
  let { line, column, offset } = context;
  return { line, column, offset };
}

function advancePositionWithMutation(context, source, endIndex) {
  let linesCount = 0;
  let linePos = -1;
  for (let i = 0; i < endIndex; i++) {
    if (source.charCodeAt(i) == 10) {
      // 记录回车符的个数
      linesCount++;
      linePos = i;
    }
  }
  context.line += linesCount;
  context.column =
    linePos == -1 ? context.column + endIndex : endIndex - linePos + 1;
  context.offset += endIndex;
}

function advanceBy(context, endIndex) {
  // 每次删掉内容时都要更新最新的行列信息和偏移量信息
  let source = context.source;
  advancePositionWithMutation(context, source, endIndex);
  context.source = context.source.slice(endIndex);
}

function parseTextData(context, endIndex) {
  const rawText = context.source.slice(0, endIndex); // 截取到结束的位置
  advanceBy(context, rawText.length);
  return rawText;
}

function getSelection(context, start, end?) {
  end = end || getCursor(context);
  return {
    start,
    end,
    source: context.originalSource.slice(start.offset, end.offset),
  };
}

function parseText(context) {
  // 解析时需要看到哪里结束
  let endTokens = ['<', '{{'];
  let endIndex = context.source.length;
  // 默认到末尾结束
  for (let i = 0; i < endTokens.length; i++) {
    let index = context.source.indexOf(endTokens[i], 1);
    // 找到第一次出现的位置且下标小于字符串长度
    if (index !== -1 && index < endIndex) {
      endIndex = index;
    }
  }
  // 创建行列信息
  const start = getCursor(context);
  // 截取内容
  const content = parseTextData(context, endIndex);
  // 获取结束位置
  return {
    type: NodeTypes.TEXT,
    content: content,
    loc: getSelection(context, start),
  };
}

function parse(template) {
  // 创建一个解析的上下文来进行处理
  const context = createParserContext(template);
  // < 元素
  // {{ 表达式
  // 其他就是文本
  const nodes = [];
  while (isEnd(context)) {
    const source = context.source;
    let node;
    if (source.startsWith('{{')) {
      node = 'xxx';
    } else if (source[0] === '<') {
      node = 'qqq';
    }
    if (!node) {
      node = parseText(context);
    }
    nodes.push(node);
  }
}

export function compile(template) {
  // 将模版转换成抽象语法树AST
  const ast = parse(template);
  // 此处需要将html语法转换成js语法
  return ast;
}
