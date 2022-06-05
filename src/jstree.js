import * as acorn from 'acorn';

function handleParam(param, options) {
  const { type, left, right } = param;
  if (type !== 'AssignmentPattern') {
    throw new Error(`handleParam() no type defined for ${param}`);
  }
  if (right.type === 'Identifier') {
    const typeAnnotation = right.name;
    const p = { ...left, typeAnnotation };
    options.scope[left.name] = typeAnnotation;
    return p;
  } else if (right.type === 'CallExpression') {
    param.left.typeAnnotation = right.callee.name;
    [param.right] = right.arguments;
    options.scope[param.left.name] = param.left.typeAnnotation;
    return param;
  }
  throw new Error(`dont know ${right}`);
}

function handleParams(fn, options) {
  const params = fn.params.map((param) => {
    const { type, right } = param;
    if (type !== 'AssignmentPattern') {
      console.error('handleParams() no type defined for', param);
      throw new Error(`handleParams() no type defined for ${param}`);
    }

    if (right.type === 'CallExpression' && right.callee.name === 'type') {
      [param.right] = right.arguments;
    }

    return handleParam(param, options);
  });

  let { body } = fn;
  if (body.type === 'BlockStatement') {
    body.body = handleNode(body.body, options);
  } else {
    body = handleNode(body, options);
  }

  return { ...fn, body, params };
}

function extractFromScope(scope, name, args) {
  if (!scope) {
    return name;
  }
  const sc = scope[name];
  if (!sc) {
    return name;
  }
  if (typeof sc === 'function') {
    return sc.apply(undefined, args.map(({ name }) => scope[name]));
  }
  return sc;
}

function extractType(node, target, options) {
  const { qualifiers, integer, float, string, boolean, scope } = options;
  const { type, name, callee, arguments: args, value, raw } = node;

  if (type === 'CallExpression' || type === 'NewExpression') {
    if (callee.name === 'fun') {
      const [firstArg, secondArg] = args;
      if (!secondArg) {
        firstArg.returnType = 'void';
        target.newInit = handleParams(firstArg, options);
      } else {
        secondArg.returnType = firstArg.name;
        target.newInit = handleParams(secondArg, options);
      }
    } else if (callee.name === 'type') {
      extractType(args[0], target, options);
    } else if (qualifiers.includes(callee.name)) {
      target.qualifier = callee.name;
      extractType(args[0], target, options);
    } else if (args[0] && (args[0].type === 'ArrowFunctionExpression' || args[0].type === 'FunctionExpression')) {
      const [firstArg] = args;
      firstArg.returnType = callee.name;
      target.newInit = handleParams(firstArg, options);
    } else if (args[0] && (args[0].type === 'ArrayExpression')) {
      const [firstArg] = args;
      target.typeAnnotation = `${callee.name}[${firstArg.elements.length}]`;
      target.newInit = {
        ...node, arguments: [handleNode(firstArg, options)]
      };
    } else {

      const typeAnnotation = callee.name;
      target.typeAnnotation = extractFromScope(scope, typeAnnotation, args);
      target.newInit = node;
    }
  } else if (type === 'Identifier') {
    if (scope && scope[name]) {
      target.typeAnnotation = extractFromScope(scope, name, []);
      target.newInit = node;
    } else {
      target.typeAnnotation = name;
    }
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
  } else if (type === 'UnaryExpression') {
    const { argument, operator } = node;
    const { value, raw } = argument;
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
    target.newInit = {
      ...argument,
      raw: `${operator}${raw}`,
      value: operator === '-' ? -value : value
    };
  } else if (type === 'ArrowFunctionExpression') {
    const newScope = { ...scope };
    target.newInit = handleParams(node, { ...options, scope: newScope });
    target.newInit.returnType = 'void';
  } else if (type === 'BinaryExpression') {
    const left = extractFromScope(scope, node.left.name, []);
    const right = extractFromScope(scope, node.right.name, []);
    switch (node.operator) {
      case '+': {
        target.typeAnnotation = scope.add(left, right);
        break;
      }
      case '-': {
        target.typeAnnotation = scope.sub(left, right);
        break;
      }
      case '*': {
        target.typeAnnotation = scope.mul(left, right);
        break;
      }
      case '/': {
        target.typeAnnotation = scope.div(left, right);
        break;
      }
      case '%': {
        target.typeAnnotation = scope.mod(left, right);
        break;
      }
      default:
        // do nothing
        break;
    }
    target.newInit = node;
  } else {
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
    if (init.type === 'CallExpression') {
      if (init.callee.name === 'cls') {
        const { properties } = init.arguments[0];

        const body = {
          type: 'ClassBody',
          body: properties.map(({ key, value }) => {
            let typeAnnotation;
            if (value.type === 'CallExpression' && value.callee.name === 'type') {
              typeAnnotation = value.arguments[0].name;
            } else {
              typeAnnotation = value.name;
            }
            return { type: 'PropertyDefinition', typeAnnotation, key: { type: 'Identifier', name: key.name } };
          })
        };
        return { id: { ...node.id }, body, type: 'ClassDeclaration' };
      }
    }
    const { newInit = null, typeAnnotation = null, qualifier = null } = extractType(init, {}, options);
    node.id = { ...node.id, typeAnnotation, qualifier };
    node.init = newInit;

    if (typeAnnotation) {
      options.scope[node.id.name] = typeAnnotation;
    } else if (newInit.returnType) {
      options.scope[node.id.name] = newInit.returnType;
    }

    return node;
  }

  Object.entries(node).forEach(([key, value]) => {
    node[key] = handleNode(value, options);
  });
  return node;
}

export function parse(input, { qualifiers = [], float = 'Number', integer = float, string = 'String', boolean = 'Boolean', locations = false, ranges = false, scope = {}, ...options } = {}) {
  // TODO: use onToken !!!!
  const ast = acorn.parse(input, { ...options, locations, ranges, ecmaVersion: 'latest' });
  const node = handleNode(ast, { qualifiers, integer, float, string, boolean, scope });

  return node;
}
