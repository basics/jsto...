import { getSource, readOnlyView, isInstanceOf } from './utils';

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
    checkType(arg, type, 'check for default type');

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
      checkType(result, type, 'check for fun result type');
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
    if (!val) {
      throw new Error(`undefined? ${key}`);
    }
    if (val[TYPED_FUN]) {
      prototype[key] = val;
      return;
    }
    const { type } = extractType(val);
    if (!type) {
      throw new Error(`no definition found for ${key} in ${types}`);
    }
    types[key] = type;

    Object.defineProperty(prototype, key, {
      get() {
        return getInner(this, key);
      },
      set(value) {
        if (!type) {
          throw new Error(`no definition found for ${key} in ${types}`);
        }
        checkType(value, type, `check type for setter of type ${type}`);
        return setInner(this, key, value);
      }
    });
  });
  const Con = function Constructor(...args) {
    if (isInstanceOf(this, Constructor)) {
      constructor.apply(this, args);
    } else {
      const [funDef] = args;
      if (typeof funDef !== 'function') {
        if (isInstanceOf(funDef, Con)) {
          return funDef;
        }
        throw new Error('only fun definition allowd');
      }
      return fun(Con, funDef);
    }
  };

  Con.prototype = prototype;

  return readOnlyView(Con);
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

function checkType(value, expectedType, msg) {
  value = getSource(value);
  expectedType = getSource(expectedType);

  if (isInstanceOf(value, expectedType)) {
    return;
  }
  throw new Error(`
${msg}
value: ${value.x} ${value}

to be instanceof

expectedType: ${expectedType}

`);
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
