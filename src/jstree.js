// https://babeljs.io/docs/en/babel-types#identifier

// Identifier.typeAnnotation
// AssignmentPattern.typeAnnotation

// https://babeljs.io/docs/en/babel-types#qualifiedtypeidentifier

// Qualifiedtypeidentifier

// https://babeljs.io/docs/en/babel-types#arrowfunctionexpression
// ArrowFunctionExpression
// returnType

import * as acorn from 'acorn';

function extractType(node, target, options) {
  const { qualifiers } = options;
  const { type, name, callee, arguments: args } = node;

  if (type === 'CallExpression') {
    if (callee.name === 'fun') {
      const [firstArg, secondArg] = args;
      secondArg.returnType = firstArg.name;
      target.newInit = secondArg;
    } else if (callee.name === 'type') {
      extractType(args[0], target, options);
    } else if (qualifiers.includes(callee.name)) {
      target.qualifier = callee.name;
      extractType(args[0], target, options);
    } else if (args[0] && args[0].type === 'ArrowFunctionExpression') {
      const [firstArg] = args;
      firstArg.returnType = callee.name;
      target.newInit = firstArg;
    } else {
      target.typeAnnotation = callee.name;
      [target.newInit] = args;
    }
  } else if (type === 'Identifier') {
    target.typeAnnotation = name;
  }

  return target;
}

function handleNode(node, options) {
  if (Array.isArray(node)) {
    return node.map((n) => handleNode(n, options));
  }
  if (node === null) {
    return null;
  }
  const { type, init } = node;
  if (!type) {
    return node;
  }

  if (type === 'VariableDeclarator') {

    if (!init) {
      throw new Error('no type defined');
    }
    const { newInit = null, typeAnnotation = null, qualifier = null } = extractType(init, {}, options);
    node.id = { ...node.id, typeAnnotation, qualifier };
    node.init = newInit;
    return node;
  }

  Object.entries(node).forEach(([key, value]) => {
    node[key] = handleNode(value, options);
  });
  return node;
}

export function parse(input, { qualifiers = [], locations = false, ranges = false, ...options } = {}) {
  // TODO: use onToken !!!!
  const node = handleNode(acorn.parse(input, { ...options, locations, ranges }), { qualifiers });

  return node;
}
