import { BuiltIn } from './glsl/builtin';
import { readOnlyView } from './utils';

let gl;

export function sim(fun, options = {}) {
  if (!gl) {

    const builtIn = new BuiltIn(options.calc);

    const global = {};

    const b = Object.getOwnPropertyNames(BuiltIn.prototype)
      .filter((name) => (name !== 'constructor'))
      .map((name) => [name, builtIn[name].bind(builtIn)]);

    const o = Object.entries(options)
      .map(([name, func]) => (
        [name, (...args) => {
          const [first] = args;
          if (typeof first === 'function' && name !== 'calc') {
            return first;
          }
          return func(...args.map((arg) => readOnlyView(arg)));
        }]
      ));

    ([...b, ...o]).forEach(([key, value]) => {
      global[key] = value;
    });

    gl = readOnlyView(global);
  }

  return fun(gl);
}
