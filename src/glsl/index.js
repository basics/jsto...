import { parse } from '../jstree';

const qualifiers = [
  'varying',
  'uniform',
  'attribute',
  'struct'
];

function handleNode(node) {
  const { type } = node;
  if (type === 'CallExpression') {
    return calExp(node);
  }
  if (type === 'VariableDeclaration') {
    return varDec(node);
  }
  if (type === 'ArrowFunctionExpression') {
    return arrFun(node);
  }
  if (type === 'ExpressionStatement') {
    return expSta(node);
  }
  if (type === 'AssignmentExpression') {
    return assExp(node);
  }
  if (type === 'BinaryExpression') {
    return binExp(node);
  }
  if (type === 'LogicalExpression') {
    return binExp(node);
  }
  if (type === 'MemberExpression') {
    return memExp(node);
  }
  if (type === 'Identifier') {
    return ident(node);
  }
  if (type === 'ReturnStatement') {
    return retSta(node);
  }
  if (type === 'NumericLiteral') {
    return numLit(node);
  }
  if (type === 'Literal') {
    return liter(node);
  }
  if (type === 'ParenthesizedExpression') {
    return parExp(node);
  }
  if (type === 'AssignmentPattern') {
    return assPat(node);
  }
  if (type === 'IfStatement') {
    return ifStat(node);
  }
  if (type === 'UnaryExpression') {
    return unaExp(node);
  }
  if (type === 'ConditionalExpression') {
    return conExp(node);
  }
  if (type === 'ForStatement') {
    return forSta(node);
  }
  if (type === 'UpdateExpression') {
    return updExp(node);
  }
  if (type === 'BreakStatement') {
    return breSta(node);
  }
  if (type === 'ContinueStatement') {
    return conSta(node);
  }
  if (type === 'ThrowStatement') {
    return thrSta(node);
  }
  if (type === 'Property') {
    return prop(node);
  }
  // if (type === 'ArrayExpression') {
  // return arrExp(node);
  // }
  console.warn(`//handleNode() unkown type ${type}`, node);
  return `//handleNode() unkown type ${type}`;
}

function prop({ key, value }) {
  return `${value.name} ${key.name}`;
}

function thrSta(node) {
  return `throwError(${handleNode(node.argument)})`;
}

function conSta() {
  return 'continue';
}

function breSta() {
  return 'break';
}

function updExp({ argument, operator }) {
  return `${handleNode(argument)}${getOperator(operator)}`;
}

function forSta({
  body, init, test, update
}) {
  return `for(${handleNode(init)};${handleNode(test)};${handleNode(update)}) {\n\t${handleBody(body)}\n}`;
}

function conExp({ test, consequent, alternate }) {
  return `${handleNode(test)} ? ${handleNode(consequent)} : ${handleNode(alternate)}`;
}

// function arrExp({ elements }) {
//   return `{${elements.map(handleNode).join(', ')}}`;
// }

function ifStat(node) {
  const { alternate, consequent, test } = node;
  let alt = '';
  if (alternate) {
    if (alternate.type === 'IfStatement') {
      alt = ` else {\n${ifStat(alternate)}\n\t}`;
    } else {
      alt = ` else {\n${handleBody(alternate, 2)}\n\t}`;
    }
  }
  const tes = handleNode(test);
  const con = handleBody(consequent, 2);

  return `if (${tes}) {\n${con}\n\t}${alt}`;
}

function unaExp(node) {
  return `${getOperator(node.operator)}${handleNode(node.argument)}`;
}

function parExp(node) {
  return `(${handleNode(node.expression)})`;
}

function numLit(node) {
  return node.raw;
}

function liter(node) {
  return node.raw;
}

function retSta({ argument }) {
  if (!argument) {
    return 'return';
  }
  return `return ${handleNode(argument)}`;
}

function ident(node) {
  let { name, typeAnnotation, qualifier } = node;
  let q = '';
  if (qualifier) {
    q = `${qualifier} `;
  }
  let t = '';
  if (typeAnnotation) {
    t = `${typeAnnotation} `;
  }
  return `${q}${t}${name}`;
}

function memExp(node) {
  const { object, property } = node;
  if (property.type === 'Literal' || property.type === 'CallExpression') {
    return `${handleNode(object)}[${handleNode(property)}]`;
  }
  // console.log('memExp', object.name, node);
  return `${handleNode(object)}.${handleNode(property)}`;
}

function binExp(node) {
  // console.log('binExp', node);
  const { left, operator, right } = node;

  if (operator === '%') {
    return `mod(${handleNode(left)}, ${handleNode(right)})`;
  }

  return `${handleNode(left)} ${getOperator(operator)} ${handleNode(right)}`;
}

function assExp(node) {
  throwError('Default paramameters not supported in GLSL', node);
}

function getOperator(operator) {
  if (operator.length === 3) {
    return operator.substring(0, 2);
  }
  return operator;
}

function expSta(node) {
  return `${handleNode(node.expression)}`;
}

function assPat(node) {
  throwError('Default paramameters not supported in GLSL', node);
}

function arrFun(node) {
  // console.log('arrFun()', node.name, node);
  return `(${node.params.map(handleNode).join(', ')}) {\n${handleBody(node.body, 1)}\n}`;
}

function calExp(node) {
  // console.log('calExp()', node.name, node);
  const { arguments: args, callee: { name } } = node;
  if (name === 'discard') {
    return 'discard';
  }
  if (name === 'calc') {
    return handleNode(args[0].body);
  }
  return `${name}(${args.map(handleNode).join(', ')})`;
}

function varDec({ declarations }) {
  return declarations.map(handleAssign).join('; ');
}

function throwError(msg, node, ...args) {
  console.warn(msg, node, ...args);
  const error = new Error(msg);
  error.line = node.loc.start.line;
  throw error;
}

function handleAssign({ init, id }) {
  let { name, typeAnnotation, qualifier: q } = id;

  let allocation = '';
  if (!init) {
    if (!typeAnnotation) {
      throwError(`
      no type defined for ${id.name}
      ${JSON.stringify(id)}
    `, id);
    }

  } else {
    if (init.type === 'ArrowFunctionExpression') {
      typeAnnotation = init.returnType;
    }
    allocation = handleNode(init);
  }

  let qualifier = '';
  if (q) {
    qualifier = `${q} `;
  }

  return `${qualifier}${typeAnnotation} ${name}${allocation}`;
}

function handleBody(body, tabCount = 0) {
  // console.log('handleBody', body);
  //
  return body.body
    .map(handleNode)
    .map((str) => '\t'.repeat(tabCount) + str)
    .join('\n');
}

export function buildGLSL(fun) {
  // console.log('fun', fun.toString());

  const str = fun.toString();

  let ast;
  try {
    ast = parse(str, { preserveParens: true, locations: true, qualifiers, integer: 'int', float: 'float', string: '!!StringIsNotSupported!!', boolean: 'bool' });


    const { body } = ast.body[0].expression;

    let sh = handleBody(body);

    sh = sh.split('\n').map((s) => {
      const last = s[s.length - 1];
      if (last === '{' || last === '}' || last === ';') {
        return s;
      }
      return `${s};`;
    }).join('\n');

    // console.log('\n' + sh + '\n');
    return `${sh}\n`;
  } catch (e) {
    console.log('ast', ast);
    if (e.line) {
      const allLines = str.split('\n');
      const rest = allLines.slice(0, e.line - 2);
      const line = allLines[e.line - 1];

      throw new Error(`error at ${e.line}
${rest.join('\n')}
>>>>>> ${line}

${e.message}`);
    } else {
      throw e;
    }
  }
}

export function addErrorHandling(glsl) {
  const prefix = `
        #ifndef ERROR
        #define ERROR
            vec3 err;

            void throwError(vec3 error) {
                if (length(err) < 0.00000001) {
                    err = error;
                }
            }

        #endif
    `;

  const suffix = `
        void main() {
            _main();
            if (length(err) > 0.00000001) {
                gl_FragColor = vec4(err, 0.0);
            }
        }
    `;
  let nString = glsl;
  let suf = '';
  if (glsl.indexOf('void main() {') >= 0) {
    nString = glsl.replace('void main() {', 'void _main() {');
    suf = suffix;
  }

  return `${prefix} \n ${nString} \n ${suf}`;
}
