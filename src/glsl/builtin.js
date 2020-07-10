// impl copied from
// https://github.com/burg/glsl-simulator/blob/master/lib/runtime/builtins.js

export class BuiltIn {

  constructor(options) {
    this.options = options;
  }

  calc(alg) {
    const { options } = this;
    const result = options.calc(alg);
    if (typeof result === 'number') {
      return result;
    }
    if (!result) {
      throw new Error('calc returned undefined');
    }
    if (typeof result.w === 'number') {
      return options.vec4(result.x, result.y, result.z, result.w);
    }
    if (typeof result.z === 'number') {
      return options.vec3(result.x, result.y, result.z);
    }
    if (typeof result.y === 'number') {
      return options.vec2(result.x, result.y);
    }
    throw new Error(`calc unknown type of result ${result}`);
  }

  multiply(a, b) {
    return this.options.multiply(a, b);
  }

  radians(degrees) {
    return this.calc(() => (degrees / 180.0) * Math.PI);
  }

  degrees(radians) {
    return this.calc(() => (radians / Math.PI) * 180.0);
  }

  sin(x) {
    return this.calc(() => Math.sin(x));
  }

  cos(x) {
    return this.calc(() => Math.cos(x));
  }

  tan(x) {
    return this.calc(() => Math.tan(x));
  }

  asin(x) {
    return this.calc(() => Math.asin(x));
  }

  acos(x) {
    return this.calc(() => Math.acos(x));
  }

  atan(y, x) {
    return this.calc(() => {
      if (x === undefined || x === null) {
        return Math.atan(y);
      }
      return Math.atan2(y, x);
    });
  }

  pow(x, y) {
    return this.calc(() => x ** y);
  }

  exp(x) {
    return this.calc(() => Math.exp(x));
  }

  log(x) {
    return this.calc(() => Math.log(x));
  }

  exp2(x) {
    return this.calc(() => 2 ** x);
  }

  log2(x) {
    return this.calc(() => Math.log(x) / Math.log(2));
  }

  sqrt(x) {
    return this.calc(() => Math.sqrt(x));
  }

  inversesqrt(x) {
    return this.calc(() => 1 / Math.sqrt(x));
  }

  abs(x) {
    return this.calc(() => (x >= 0 ? x : -x));
  }

  sign(x) {
    return this.calc(() => (x > 0 ? 1 : -1));
  }

  floor(x) {
    return this.calc(() => Math.floor(x));
  }

  ceil(x) {
    return this.calc(() => Math.ceil(x));
  }

  fract(x) {
    return this.calc(() => x - Math.floor(x));
  }

  min(x, y) {
    return this.calc(() => Math.min(x, y));
  }

  max(x, y) {
    return this.calc(() => Math.max(x, y));
  }

  clamp(x, minVal, maxVal) {
    return this.calc(() => {
      if (minVal > maxVal) {
        throw new Error('clamp(): maxVal must be larger than minVal.');
      }
      return Math.min(Math.max(x, minVal), maxVal);
    });
  }

  mix(x, y, alpha) {
    return this.calc(() => alpha * x + (1 - alpha) * y);
  }

  step(edge, x) {
    return this.calc(() => (x < edge ? 0 : 1));
  }

  smoothstep(edge0, edge1, x) {
    return this.calc(() => {
      const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
      return t * t * (3 - 2 * t);
    });
  }

  length(v) {
    let collect = 0;
    this.calc(() => (collect += v * v));
    return Math.sqrt(collect);
  }

  distance(x, y) {
    return this.length(this.calc(() => x - y));
  }

  dot(x, y) {
    let collect = 0;
    this.calc(() => collect += x * y);
    return collect;
  }

  normalize(x) {
    const len = this.length(x);
    if (len <= Number.EPSILON) {
      return x;
    }
    return this.calc(() => x / len);
  }

  cross(x, y) {
    return this.options.vec3(
      x.y * y.z - x.z * y.y,
      x.z * y.x - x.x * y.z,
      x.x * y.y - x.y * y.x
    );
  }

  faceforward(N, I, Nref) {
    if (this.dot((Nref, I)) < 0) {
      return N;
    }
    return this.calc(() => N * -1);
  }

  reflect(I, N) {
    let temp = this.dot(I, N) * 2;
    return this.calc(() => I - N * temp);
  }

  // TODO check the correctness
  refract(I, N, eta) {
    let temp = this.dot(I, N);
    let k = 1 - eta * eta * (1 - temp * temp);

    if (k < 0) {
      return this.calc(() => I - I);
    }
    let r = eta * this.dot(I, N) + Math.sqrt(k);

    return this.calc(() => I * eta - N * r);
  }

  texture(sampler, uv) {
    return sampler.get(this, uv);
  }

  varying() {
    return undefined;
  }

  uniform() {
    return undefined;
  }

  float(nr) {
    return nr;
  }

  vecFactory(args, type, len) {
    if (!args.length) {
      throw new Error(('empty vector args not supported by glsl'));
    }

    const array = args.reduce((collect, arg) => {
      if (typeof arg === 'number') {
        collect.push(arg);
      } else if (!arg) {
        throw new Error(`cant handle undefined arg ${arg}`);
      } else {
        if (typeof arg.x === 'number') {
          collect.push(arg.x);
        }
        if (typeof arg.y === 'number') {
          collect.push(arg.y);
        }
        if (typeof arg.z === 'number') {
          collect.push(arg.z);
        }
        if (typeof arg.w === 'number') {
          collect.push(arg.w);
        }
      }
      return collect;
    }, []);

    if (Number.isNaN(array[0])) {
      throw new Error(('result cant be NaN'));
    }

    if (array.length === 1) {
      const first = array[0];
      return type(first, first, first, first);
    }

    if (array.length < len) {
      throw new Error(`assigned arg count is not enough, expected ${len} but got ${array.length}`, args);
    }
    return type(...array);
  }

  vec2(...args) {
    return this.vecFactory(args, this.options.vec2, 2);
  }

  vec3(...args) {
    return this.vecFactory(args, this.options.vec3, 3);
  }

  vec4(...args) {
    return this.vecFactory(args, this.options.vec4, 4);
  }
}
