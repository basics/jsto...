
const TYPED_FUN = Symbol('typed function');
const INNER_DATA = Symbol('inner data');

let activeArgList;
let activeArgIndex;

export const string = String;
export const number = Number;
export const boolean = Boolean;

export function typ(typeDesc) {
  const { type, def } = extractType(typeDesc);
  if (!type) {
    throw new Error('no type assigned');
  }
  if (activeArgList) {
    let arg = activeArgList[activeArgIndex];
    activeArgIndex += 1;
    if (activeArgIndex === activeArgList.length) {
      activeArgList = undefined;
      activeArgIndex = undefined;
    }
    checkType(arg, type);

    return arg;
  }
  return def;
}

export function fun(type, func) {
  if (func === undefined) {
    func = type;
    type = undefined;
  }
  function f(...args) {
    try {
      activeArgList = args;
      activeArgIndex = 0;
      const result = func.apply(this);
      checkType(result, type);
      return result;
    } finally {
      activeArgList = undefined;
    }
  }
  f[TYPED_FUN] = true;
  return f;
}

export function cls(classDesc) {
  const { constructor, ...proto } = classDesc;

  const types = {};
  const prototype = {};
  Object.entries(proto).forEach(([key, val]) => {
    if (val[TYPED_FUN]) {
      prototype[key] = val;
      return;
    }
    const { type } = extractType(val);
    types[key] = type;

    Object.defineProperty(prototype, key, {
      get() {
        return getInner(this, key);
      },
      set(value) {
        checkType(value, types[key]);
        return setInner(this, key, value);
      }
    });
  });
  function con(...args) {
    if (this instanceof con) {
      constructor.apply(this, args);
    } else {
      const [funDef] = args;
      if (typeof funDef !== 'function') {
        throw new Error('only fun definition allowd');
      }
      return fun(con, funDef);
    }
  }
  con.prototype = prototype;

  return con;
}

function extractType(type) {
  if (type === undefined || type === null) {
    throw new Error('no type assigned');
  }
  const to = typeof type;
  if (to === 'function') {
    return {
      type,
      def: undefined
    };
  }
  if (to === 'number') {
    return {
      type: Number,
      def: type
    };
  }
  if (to === 'string') {
    return {
      type: String,
      def: type
    };
  }
  if (to === 'boolean') {
    return {
      type: Boolean,
      def: type
    };
  }
  if (type.constructor) {
    return {
      type: type.constructor,
      def: type
    };
  }
  throw new Error(`no type found ${type}`);
}

function checkType(type, expected) {
  if (type === expected) {
    return;
  }
  if (expected === undefined) {
    if (type !== undefined) {
      throw new Error(`void function doesn't allow results ${type}`);
    }
    return;
  }
  const to = typeof type;
  if (expected === String && to === 'string') {
    return;
  }
  if (expected === Number && to === 'number') {
    return;
  }
  if (expected === Boolean && to === 'boolean') {
    return;
  }
  if (type.constructor === expected) {
    return;
  }
  if (type instanceof expected) {
    return;
  }
  throw new Error(`${expected} function doesn't allow results ${type}`);
}

function getInner(obj, key) {
  const data = obj[INNER_DATA];
  if (!data) {
    return;
  }
  return data[key];
}

function setInner(obj, key, value) {
  let data = obj[INNER_DATA];
  if (!data) {
    data = {};
    obj[INNER_DATA] = data;
  }
  data[key] = value;
  return true;
}
