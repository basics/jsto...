import { getSource, readOnlyView, isInstanceOf } from './utils';

const TYPED_FUN = Symbol('typed function');
const TYPED_PROP = Symbol('typed property');
const INNER_DATA = Symbol('inner data');

let activeArgList;
let activeArgIndex;

let insideConstructor = false;

export const string = String;
export const number = Number;
export const boolean = Boolean;

export function typ(typeDesc) {
  const { type, def } = extractType(typeDesc);
  if (!type) {
    throw new Error('no type assigned');
  }
  if ((!activeArgList || activeArgIndex === activeArgList.length) && insideConstructor) {
    return {
      [TYPED_PROP]: true,
      type,
      def
    };
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

    if (args.length) {
      activeArgList = args;
      activeArgIndex = 0;
    }
    let result;
    try {
      result = func.apply(this);

      if (activeArgList && activeArgIndex < activeArgList.length) {
        throw new Error(`wrong argument length? expected: ${activeArgIndex} is: ${activeArgList.length}`);
      }
    } finally {
      activeArgList = undefined;
      activeArgIndex = -999;
    }
    checkType(result, type, 'check for fun result type');
    return result;

  }
  f[TYPED_FUN] = true;
  return f;
}

export function cls(classDesc) {
  let { constructor, ...proto } = classDesc;

  let realClass = false;
  if (typeof classDesc === 'function') {
    realClass = true;
    constructor = classDesc;
    proto = classDesc.prototype;
  }

  const types = {};

  let Con;
  if (realClass) {
    Con = class Con extends classDesc {

      constructor(...args) {
        activeArgList = args;
        activeArgIndex = 0;
        insideConstructor = true;

        try {
          super();
          if (activeArgList && activeArgIndex < activeArgList.length) {
            throw new Error(`wrong argument length? expected: ${activeArgIndex} is: ${activeArgList.length}`);
          }
        } finally {
          activeArgList = undefined;
          activeArgIndex = -999;
          insideConstructor = false;
        }

        Object.entries(this)
          .forEach(([key, prop]) => {
            if (!prop || !prop[TYPED_PROP]) {
              return;
            }
            const { type, def } = prop;

            if (def !== undefined) {
              checkType(def, type, `check type for setter of type ${type}`);
            }
            Object.defineProperty(this, key, {
              get() {
                return getInner(this, key);
              },
              set(value) {
                checkType(value, type, `check type for setter of type ${type}`);
                return setInner(this, key, value);
              }
            });
          });
      }
    };
  } else {
    Con = function Constructor(...args) {
      if (isInstanceOf(this, Constructor)) {
        constructor.apply(this, args);
      } else {
        if (!args.length) {
          return typ(Con);
        }
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
  }

  const { prototype } = Con;

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

export function checkType(value, expectedType, msg) {
  value = getSource(value);
  expectedType = getSource(expectedType);

  if (isInstanceOf(value, expectedType)) {
    return;
  }
  throw new Error(`
${msg}
value: ${value}

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
