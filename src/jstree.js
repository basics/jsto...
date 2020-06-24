import * as acorn from 'acorn';

function handleParam(param) {
  const { type, left, right } = param;
  if (type !== 'AssignmentPattern') {
    throw new Error(`no type defined for ${param}`);
  }
  if (right.type === 'Identifier') {
    const typeAnnotation = right.name;
    return { ...left, typeAnnotation };
  } else if (right.type === 'CallExpression') {
    param.left.typeAnnotation = right.callee.name;
    [param.right] = right.arguments;
    return param;
  }
  throw new Error(`dont know ${right}`);
}

function handleParams(fn) {
  const params = fn.params.map((param) => {
    const { type, right } = param;
    if (type !== 'AssignmentPattern') {
      throw new Error(`no type defined for ${param}`);
    }

    if (right.type === 'CallExpression' && right.callee.name === 'type') {
      [param.right] = right.arguments;
    }

    return handleParam(param);
  });
  return { ...fn, params };
}

function extractType(node, target, options) {
  const { qualifiers, integer, float, string, boolean } = options;
  const { type, name, callee, arguments: args, value, raw } = node;

  if (type === 'CallExpression') {
    if (callee.name === 'fun') {
      const [firstArg, secondArg] = args;
      secondArg.returnType = firstArg.name;
      target.newInit = handleParams(secondArg);
    } else if (callee.name === 'type') {
      extractType(args[0], target, options);
    } else if (qualifiers.includes(callee.name)) {
      target.qualifier = callee.name;
      extractType(args[0], target, options);
    } else if (args[0] && (args[0].type === 'ArrowFunctionExpression' || args[0].type === 'FunctionExpression')) {
      const [firstArg] = args;
      firstArg.returnType = callee.name;
      target.newInit = handleParams(firstArg);
    } else {
      target.typeAnnotation = callee.name;
      [target.newInit] = args;
    }
  } else if (type === 'Identifier') {
    target.typeAnnotation = name;
  } else if (type === 'NumericLiteral' || type === 'Literal') {
    if (typeof value === 'number') {
      if (raw.indexOf('.') < 0) {
        target.typeAnnotation = integer;
      } else {
        target.typeAnnotation = float;
      }
    } else if (typeof value === 'boolean') {
      target.typeAnnotation = boolean;
    } else {
      target.typeAnnotation = string;
    }
    target.newInit = node;
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

export function parse(input, { qualifiers = [], float = 'Number', integer = float, string = 'String', boolean = 'Boolean', locations = false, ranges = false, ...options } = {}) {
  // TODO: use onToken !!!!
  const ast = acorn.parse(input, { ...options, locations, ranges });
  const node = handleNode(ast, { qualifiers, integer, float, string, boolean });

  return node;
}
