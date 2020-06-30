
const PROXY = Symbol('is proxy');

// https://blog.bitsrc.io/a-practical-guide-to-es6-proxy-229079c3c2f0
const NOPE = () => {
  throw new Error("Can't modify read-only view");
};

const NOPE_HANDLER = {
  set: NOPE,
  defineProperty: NOPE,
  deleteProperty: NOPE,
  preventExtensions: NOPE,
  setPrototypeOf: NOPE
};

export function readOnlyView(target) {
  if (target === undefined || target === null) {
    return target;
  }
  if (target && target[PROXY]) {
    return target;
  }
  const to = typeof target;
  if (to === 'number' || to === 'boolean' || to === 'string') {
    return target;
  }
  const proxy = new Proxy(target, NOPE_HANDLER);
  proxy[PROXY] = true;
  return proxy;
}
