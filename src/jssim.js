import { readOnlyView, setSource } from './utils';

let gl;
let global;

export function sim(func, { BuiltIn, ...options } = {}, extras) {
  if (!gl) {

    const builtIn = new BuiltIn(options);

    global = {};

    Object.getOwnPropertyNames(BuiltIn.prototype)
      .filter((name) => (name !== 'constructor'))
      // FIXME: do here the checktype of builtin
      .map((name) => [name, builtIn[name].bind(builtIn)])
      .forEach(
        ([key, value]) => global[key] = value
      );

    gl = readOnlyView(global);
  }

  let result;
  if (extras) {
    result = func(readOnlyView({ ...global, ...extras }));

    const rm = result.main;
    const em = extras.main;
    if (rm && em) {
      result.main = () => {
        em();
        rm();
      };
    }
  } else {
    result = func(gl);
  }

  if (!result) {
    throw new Error('function must return outline');
  }

  result.setParam = (uniform, value) => {
    setSource(uniform, value);
  };

  return result;
}
