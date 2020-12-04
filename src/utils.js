const IS_PROXY = Symbol('is proxy');
const PROXY = Symbol('proxy source');

// https://blog.bitsrc.io/a-practical-guide-to-es6-proxy-229079c3c2f0
const NOPE = () => {
  throw new Error("Can't modify read-only view");
};

class Num {
  constructor(nr) {
    this.nr = nr;
  }

  valueOf() {
    return this.nr;
  }

  toString() {
    return `${this.nr}`;
  }
}

export function readOnlyView(target) {
  if (target === undefined || target === null) {
    return target;
  }
  if (target !== BLOCKED) {
    if (target && target[IS_PROXY]) {
      return target;
    }
    const { constructor } = target;
    if (constructor === Number) {
      return target;
    }
    if (constructor === Num) {
      return target.nr;
    }
    if (constructor === Boolean) {
      return target;
    }
    if (constructor === String) {
      return target;
    }
    const to = typeof target;
    if (to === 'function' || to === 'number' || to === 'boolean' || to === 'string') {
      return target;
    }
  }

  const data = { target };

  return new Proxy(data, {
    defineProperty: NOPE,
    deleteProperty: NOPE,
    preventExtensions: NOPE,
    setPrototypeOf: NOPE,
    set(data, key, value) {
      if (key === PROXY) {
        data.target = value;
        return true;
      }
      NOPE();
    },
    get(_, key) {
      if (key === IS_PROXY) {
        return true;
      }
      if (key === PROXY) {
        return data.target;
      }
      return data.target[key];
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
    throw new Error(`no proxy assigning here ${proxy}`);
  }
  if (isBoolean(target)) {
    throw new Error(`
      Proxy does not support booleans

      Boolean(readOnlyView(false))
      would always be truthy
    `);
  }
  if (isNumber(target)) {
    target = new Num(target);
  }
  proxy[PROXY] = target;
  return true;
}

const NOACCES = () => {
  throw new Error("Can't access, variable probably not inited yet");
};

export const BLOCKED = new Proxy({ name: 'BLOCKED' }, {
  defineProperty: NOACCES,
  deleteProperty: NOACCES,
  preventExtensions: NOACCES,
  setPrototypeOf: NOACCES,
  set: NOACCES,
  get: NOACCES
});

export function isInstanceOf(value, clazz) {
  if (clazz === undefined) {
    if (value !== undefined) {
      return false;
    }
    return true;
  }

  if (value === undefined) {
    return false;
  }

  const to = typeof value;
  if (clazz === String && to === 'string') {
    return true;
  }
  if (clazz === Number && isNumber(value)) {
    return true;
  }
  if (clazz === Boolean && to === 'boolean') {
    return true;
  }
  if (Object.getPrototypeOf(value) === clazz.prototype) {
    return true;
  }
  return false;
}

export function isNumber(nr) {
  if (typeof nr === 'number' || nr?.constructor === Number || nr?.constructor === Num) {
    return true;
  }
  return false;
}

export function isBoolean(bool) {
  if (typeof bool === 'boolean' || bool?.constructor === Boolean) {
    return true;
  }
  return false;
}
