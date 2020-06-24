
const DUMMY = () => undefined;

const handler = {
  get({ target, options }, prop) {
    let res = target[prop];
    if (!res) {

      const fun = options[prop] || DUMMY;

      res = (...args) => {
        const [first] = args;
        if (typeof first === 'function' && prop !== 'calc') {
          return first;
        }
        return fun(...args);
      };

      target[prop] = res;
    }
    return res;
  },
  set(obj, prop/* , value */) {
    throw new Error(`set not implemented :( ${prop}`);
  }
};

export function sim(fun, options = {}) {
  const target = {};
  const global = new Proxy({ options, target }, handler);
  return fun(global);
}
