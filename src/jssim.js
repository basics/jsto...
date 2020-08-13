import { readOnlyView } from './utils';

let gl;
let global;

export function sim(fun, { BuiltIn, ...options } = {}, extras) {
  if (!gl) {

    const builtIn = new BuiltIn(options);

    global = {};

    Object.getOwnPropertyNames(BuiltIn.prototype)
      .filter((name) => (name !== 'constructor'))
      .map((name) => [name, (...args) => {
        const [first] = args;
        if (typeof first === 'function' && name !== 'calc') {
          return first;
        }
        return builtIn[name](...args.map((arg) => readOnlyView(arg)));
      }])
      .forEach(
        ([key, value]) => global[key] = value
      );

    gl = readOnlyView(global);
  }

  let result;
  if (extras) {
    result = fun(readOnlyView({ ...global, ...extras }));
  } else {
    result = fun(gl);
  }

  if (!result) {
    throw new Error('function must return outline');
  }
  return result;
}
