import { BuiltIn } from './glsl/bultin';
import { readOnlyView } from './utils';

let builtIn;

export function sim(fun, options = {}) {
  if (!builtIn) {

    builtIn = new BuiltIn();

    const glbl = typeof window === 'undefined' ? global : window;

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
      if (glbl[key]) {
        throw new Error(`${key} is already defined :(`);
      }
      glbl[key] = value;
    });
  }

  return fun();
}
