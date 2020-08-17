import { readOnlyView, setSource } from './utils';

// const IS_BUILTIN = Symbol('is builtin');

let gl;
let global;

export function sim(fun, { BuiltIn, ...options } = {}, extras) {
  if (!gl) {

    const builtIn = new BuiltIn(options);

    global = {};

    Object.getOwnPropertyNames(BuiltIn.prototype)
      .filter((name) => (name !== 'constructor'))
      // .map((name) => {
      //   const fn = (...args) => {
      //     const [first] = args;
      //     if (typeof first === 'function' && name !== 'calc' && !first[IS_BUILTIN]) {
      //       return first;
      //     }
      //     // FIXME: do here the checktype of builtin


      //     return builtIn[name](...args.map((arg) => readOnlyView(arg)));
      //   };
      //   fn[IS_BUILTIN] = true;
      //   return [name, fn];
      // })
      .map((name) => [name, builtIn[name].bind(builtIn)])
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

  result.setParam = (uniform, value) => {
    setSource(uniform, value);
  };

  return readOnlyView(result);
  // const res = {};
  // Object.entries(result)
  //   .forEach(
  //     ([name, fn]) => {
  //       console.log('fn???', typeof fn);
  //       res[name] = (...args) => fn(...args.map((arg) => readOnlyView(arg)));
  //     }
  //   );
  // return readOnlyView(res);
}
