import { readOnlyView } from './utils';

let gl;

export function sim(fun, { BuiltIn, ...options } = {}) {
  if (!gl) {

    const builtIn = new BuiltIn(options);

    const global = {};

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

  return fun(gl);
}
