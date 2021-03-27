import { parse } from '../jstree';
import { sim } from '../jssim';
import { BuiltIn } from './builtin';
import { sampler2D, renderToCanvas } from './builtin-texture';
import { readOnlyView } from '../utils';

const LINE = Symbol('Line');
const ORIGINALS = Symbol('Originals');

const qualifiers = [
  'varying',
  'uniform',
  'attribute',
  'input',
  'output'
];

const TREE_SETTINGS = {
  qualifiers,
  preserveParens: true,
  locations: true,
  integer: 'int',
  float: 'float',
  boolean: 'bool',
  string: '!!StringIsNotSupported!!'
};

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
    return breSta();
  }
  if (type === 'ContinueStatement') {
    return conSta();
  }
  if (type === 'ThrowStatement') {
    return thrSta(node);
  }
  if (type === 'Property') {
    return prop(node);
  }
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

function prepareQualifier(qualifier) {
  if (qualifier === 'input') {
    return 'in';
  }
  if (qualifier === 'output') {
    return 'out';
  }
  return qualifier;
}

function ident(node) {
  let { name, typeAnnotation, qualifier } = node;
  let q = '';
  if (qualifier) {
    q = `${prepareQualifier(qualifier)} `;
  }
  let t = '';
  if (typeAnnotation) {
    t = `${typeAnnotation} `;
  }
  return `${q}${t}${name}`;
}

function memExp(node) {
  const { object, property, computed } = node;
  if (property.type === 'Literal' || property.type === 'CallExpression') {
    return `${handleNode(object)}[${handleNode(property)}]`;
  }
  if (computed) {
    return `${handleNode(object)}[${handleNode(property)}]`;
  }
  return `${handleNode(object)}.${handleNode(property)}`;
}

function binExp(node) {
  const { left, operator, right } = node;

  if (operator === '%') {
    return `mod(${handleNode(left)}, ${handleNode(right)})`;
  }

  if (operator === '**') {
    return `pow(${handleNode(left)}, ${handleNode(right)})`;
  }

  return `${handleNode(left)} ${getOperator(operator)} ${handleNode(right)}`;
}

function assExp(node) {
  return `${handleNode(node.left)} ${getOperator(node.operator)} ${handleNode(node.right)}`;
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
  if (node.right) {
    throwError('AssignmentPattern Default paramameters not supported in GLSL', node);
  }
  return `${handleNode(node.left)}`;
}

function arrFun(node) {
  // console.log('arrFun()', node.name, node);
  return `(${node.params.map(handleNode).join(', ')}) {\n${handleBody(node.body, 1)}\n}`;
}

function calExp(node) {
  // console.log('calExp()', node.name, node);
  const { arguments: args, callee } = node;
  const { name, object } = callee;

  if (object && object.name === 'console') {
    return '/* console statement */';
  }
  if (name === 'discard') {
    return 'discard';
  }
  if (name === 'calc') {
    return `(${handleNode(args[0].body)})`;
  }
  return `${handleNode(callee)}(${args.map(handleNode).join(', ')})`;
}

function varDec({ declarations, kind }) {
  return declarations.map((declaration) => handleAssign(declaration, kind)).join('; ');
}

function throwError(msg, node) {
  const error = new Error(msg);
  error[LINE] = node.loc.start.line;
  throw error;
}

function handleAssign(node, kind) {
  const { init, id } = node;
  let { name, typeAnnotation, qualifier: q } = id;

  let allocation = '';
  if (!init) {
    if (node.type === 'ClassDeclaration') {

      const { body } = node.body;
      const props = body
        .map(({ typeAnnotation, key }) => `${typeAnnotation} ${key.name}`)
        .join('; ');
      return `struct ${id.name} { ${props}; };`;
    }
    if (!typeAnnotation) {
      throwError(`
      handleAssign() no type defined for ${id.name}
      ${JSON.stringify(node, null, '\t')}
    `, id);
    }

  } else {
    if (init.type === 'ArrowFunctionExpression') {
      typeAnnotation = init.returnType;
      allocation = handleNode(init);
      kind = undefined;
    } else {
      allocation = handleAlloc(init, typeAnnotation, name);
    }
  }
  if (!typeAnnotation) {
    throwError(`
      handleAssign() 2 no type defined for ${id.name} allocation ${allocation}
      ${JSON.stringify(node, null, '\t')}
    `, id);
  }

  let qualifier = '';
  if (q) {
    qualifier = `${prepareQualifier(q)} `;
  } else if (kind === 'const') {
    qualifier = 'const ';
  }
  return `${qualifier}${typeAnnotation} ${name}${allocation}`;
}

function handleAlloc(init, typeAnnotation, name) {
  let allocation = '';
  if (init.type === 'CallExpression') {

    switch (typeAnnotation) {
      case 'int':
      case 'float':
      case 'bool':
      case 'vec2':
      case 'vec3':
      case 'vec4':
      case 'mat3':
      case 'mat4':
        if (init.arguments.length || typeAnnotation !== init.callee.name) {
          allocation = ` = ${handleNode(init)}`;
        } else {
          allocation = '';
        }
        break;
      default:
        if (init.arguments.length) {
          if (init.arguments.length === 1) {
            const [first] = init.arguments;
            if (first.type === 'ArrayExpression') {
              const els = first.elements.map((n) => `${handleNode(n)}`).join(', ');
              allocation = ` = ${typeAnnotation}(${els});`;
            } else {
              allocation = ` = ${handleNode(init.arguments[0])}`;
            }
          } else {
            throwError(`classes dont support init calls yet ${typeAnnotation}`, init);
          }
        }
        break;
    }
  } else if (init.type === 'NewExpression') {
    if (init.arguments.length) {
      if (init.arguments.length === 1) {
        allocation = ` = ${handleNode(init.arguments[0])}`;
      } else {
        throwError(`classes dont support init calls yet ${typeAnnotation} `, init);
      }
    } else {
      allocation = '';
    }
  } else {
    allocation = ` = ${handleNode(init)}`;
  }

  return allocation;
}

function handleBody(body, tabCount = 0) {
  return body.body
    .map(handleNode)
    .map((str) => '\t'.repeat(tabCount) + str)
    .join('\n');
}

// function replaceGenType(node) {
//   console.log('replaceGenType', node);
//   return node;
// }
//
// function handleGenTypes(body) {
//   return body.map((node) => {
//     if (node.right && node.right.init && node.right.init.returnType === 'genType') {
//       return [
//         replaceGenType(JSON.parse(JSON.stringify(node)), 'float'),
//         replaceGenType(JSON.parse(JSON.stringify(node)), 'vec2'),
//         replaceGenType(JSON.parse(JSON.stringify(node)), 'vec3'),
//         replaceGenType(JSON.parse(JSON.stringify(node)), 'vec4')
//       ];
//     }
//     return [node];
//   }).flat(1);
// }

function handeAst(node) {
  const { body } = node.body[0].expression;

  body.body = body.body.filter(({ type }) => (type !== 'ReturnStatement'));
  // body.body = handleGenTypes(body.body);
  let sh = handleBody(body);

  sh = sh.split('\n').map((s) => {
    const last = s[s.length - 1];
    if (!s.length) {
      return s;
    }
    if (last === '{' || last === '}' || last === ';' || last === '/') {
      return s;
    }
    return `${s};`;
  }).join('\n');

  // console.log('\n' + sh + '\n');
  return `${sh}\n`;
}

export function buildGLSL(fun, { glsl = true, js = undefined, ast = undefined } = {}) {
  // console.log('fun', fun.toString());

  let str;
  let node;
  let code;
  let text;
  try {
    if (glsl || ast) {
      str = fun.toString();
      node = parse(str, TREE_SETTINGS);
    }

    if (glsl) {
      text = handeAst(node);
    }

    if (js) {
      if (js === true) {
        js = {};
      }
      code = sim(fun, { BuiltIn, ...js });
    }

    return { glsl: text, ast: node, js: readOnlyView(code), [ORIGINALS]: [fun] };
  } catch (e) {
    if (e[LINE]) {
      const allLines = str.split('\n');
      const rest = allLines.slice(0, e[LINE] - 2);
      const line = allLines[e[LINE] - 1];

      throw new Error(`error at ${e.line}
${rest.join('\n')}
>>>>>> ${line}

${e.message}`);
    } else {
      throw e;
    }
  }
}

export function joinGLSL(args, { glsl: glslOn = true, js: jsOn = false, ast: astOn = false } = {}) {
  const options = { ...TREE_SETTINGS, scope: {} };
  const { asts, js, originals, keys } = args.reduce((mem, { [ORIGINALS]: originals }) => {
    if (jsOn) {
      originals.forEach((original) => {
        mem.js = sim(original, { BuiltIn }, mem.keys);

        Object.entries(mem.js).forEach(([key, value]) => {
          mem.keys[key] = value;
        });
      });
    }
    if (glslOn || astOn) {
      originals.forEach((fun) => {
        const str = fun.toString();
        const ast = parse(str, options);
        mem.asts.push(ast);
      });
    }
    mem.originals.push(...originals);
    return mem;
  }, { asts: [], js: undefined, keys: {}, originals: [] });

  let glsl;
  if (glslOn) {
    const { body, mains } = asts.reduce((mem, node) => {
      let { body: { body } } = node.body[0].expression;
      let main = body[0].declarations.find(({ id }) => (id && id.name === 'main'));
      body[0].declarations = body[0].declarations.filter(({ id }) => (!id || id.name !== 'main'));

      mem.body.push(...body);
      if (main) {
        mem.mains.push(main);
      }
      return mem;
    }, { body: [], mains: [] });

    if (mains.length) {
      const initBody = mains.reduce((res, { init: { body } }) => {
        res.push(...body.body);
        return res;
      }, []);

      const main = mains[0];
      main.init.body.body = initBody;

      body.push({ declarations: [main], type: 'VariableDeclaration', kind: 'let' });
    }

    glsl = handeAst({ body: [{ expression: { body: { body } } }] });
  }

  if (js) {
    Object.entries(keys).forEach(([key, value]) => {
      if (!js[key]) {
        js[key] = value;
      }
    });
  }
  return { glsl, js: readOnlyView(js), [ORIGINALS]: originals };
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
export { sampler2D, renderToCanvas };
