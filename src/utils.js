
const IS_PROXY = Symbol('is proxy');
const PROXY = Symbol('proxy source');

// https://blog.bitsrc.io/a-practical-guide-to-es6-proxy-229079c3c2f0
const NOPE = () => {
  throw new Error("Can't modify read-only view");
};

export function readOnlyView(target) {
  if (target === undefined || target === null) {
    return target;
  }
  if (target && target[IS_PROXY]) {
    return target;
  }
  if (target instanceof Number) {
    return target;
  }
  if (target instanceof Boolean) {
    return target;
  }
  if (target instanceof String) {
    return target;
  }
  const to = typeof target;
  if (to === 'function' || to === 'number' || to === 'boolean' || to === 'string') {
    return target;
  }
  return new Proxy(target, {
    defineProperty: NOPE,
    deleteProperty: NOPE,
    preventExtensions: NOPE,
    setPrototypeOf: NOPE,
    set(_, key, value) {
      if (key === PROXY) {
        target = value;
        return true;
      }
      NOPE();
    },
    get(_, key) {
      if (key === IS_PROXY) {
        return true;
      }
      if (key === PROXY) {
        return target;
      }
      return target[key];
    }
  });
}

export function getSource(proxy) {
  if (!proxy) {
    return proxy;
  }
  if (proxy[IS_PROXY]) {
    return proxy[PROXY];
  }
  return proxy;
}

export function setSource(proxy, target) {
  if (!proxy[IS_PROXY]) {
    throw new Error(`no proxy assigned here ${proxy}`);
  }
  proxy[PROXY] = target;
  return true;
}
