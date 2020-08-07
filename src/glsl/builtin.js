// impl copied from
// https://github.com/burg/glsl-simulator/blob/master/lib/runtime/builtins.js

import { swizzle } from './swizzle';
import { prepare, fastCalc } from './fast-calc';

prepare(Number, 1);
export class BuiltIn {

  constructor(options) {
    this.options = options;
    const { Vec2, Vec3, Vec4 } = options;
    swizzle({ Vec2, Vec3, Vec4 });

    prepare(Vec2, 2);
    prepare(Vec3, 3);
    prepare(Vec4, 4);
  }

  calc(alg) {
    return this.options.calc(alg);
  }

  radians(degrees) {
    return fastCalc(
      (degrees) => (degrees / 180.0) * Math.PI,
      degrees
    );
  }

  degrees(radians) {
    return fastCalc(
      (radians) => (radians / Math.PI) * 180.0,
      radians
    );
  }

  sin(x) {
    return fastCalc(Math.sin, x);
  }

  cos(x) {
    return fastCalc(Math.cos, x);
  }

  tan(x) {
    return fastCalc(Math.tan, x);
  }

  asin(x) {
    return fastCalc(Math.asin, x);
  }

  acos(x) {
    return fastCalc(Math.acos, x);
  }

  atan(y, x) {
    return fastCalc((y, x) => {
      if (x === undefined || x === null) {
        return Math.atan(y);
      }
      return Math.atan2(y, x);
    }, y, x);
  }

  pow(x, y) {
    return fastCalc(
      (x, y) => x ** y,
      x, y
    );
  }

  exp(x) {
    return fastCalc(Math.exp, x);
  }

  log(x) {
    return fastCalc(Math.log, x);
  }

  exp2(x) {
    return fastCalc(
      (x) => 2 ** x,
      x
    );
  }

  log2(x) {
    return fastCalc(
      (x) => Math.log(x) / Math.log(2),
      x
    );
  }

  sqrt(x) {
    return fastCalc((x) => Math.sqrt(x), x);
  }

  inversesqrt(x) {
    return fastCalc((x) => 1 / Math.sqrt(x), x);
  }

  abs(x) {
    return fastCalc((x) => (x >= 0 ? x : -x), x);
  }

  sign(x) {
    return fastCalc((x) => (x > 0 ? 1 : -1), x);
  }

  floor(x) {
    return fastCalc(Math.floor, x);
  }

  ceil(x) {
    return fastCalc(Math.ceil, x);
  }

  fract(x) {
    return fastCalc((x) => x - Math.floor(x), x);
  }

  min(x, y) {
    return fastCalc(Math.min, x, y);
  }

  max(x, y) {
    return fastCalc(Math.max, x, y);
  }

  clamp(x, minVal, maxVal) {
    return fastCalc((x, minVal, maxVal) => {
      if (minVal > maxVal) {
        throw new Error('clamp(): maxVal must be larger than minVal.');
      }
      return Math.min(Math.max(x, minVal), maxVal);
    }, x, minVal, maxVal);
  }

  mix(x, y, alpha) {
    return fastCalc(
      (x, y, alpha) => alpha * x + (1 - alpha) * y,
      x, y, alpha
    );
  }

  step(edge, x) {
    return fastCalc((edge, x) => (x < edge ? 0 : 1), edge, x);
  }

  smoothstep(edge0, edge1, x) {
    return fastCalc((edge0, edge1, x) => {
      const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
      return t * t * (3 - 2 * t);
    }, edge0, edge1, x);
  }

  length(v) {
    let collect = 0;
    fastCalc((v) => (collect += v * v), v);
    return Math.sqrt(collect);
  }

  distance(x, y) {
    return this.length(fastCalc((x, y) => x - y, x, y));
  }

  dot(x, y) {
    let collect = 0;
    fastCalc((x, y) => collect += x * y, x, y);
    return collect;
  }

  normalize(x) {
    const len = this.length(x);
    if (len <= Number.EPSILON) {
      return x;
    }
    return fastCalc((x) => x / len, x);
  }

  cross(x, y) {
    return this.vec3(
      x.y * y.z - x.z * y.y,
      x.z * y.x - x.x * y.z,
      x.x * y.y - x.y * y.x
    );
  }

  faceforward(N, I, Nref) {
    if (this.dot(Nref, I) < 0) {
      return N;
    }
    return fastCalc((N) => N * -1, N);
  }

  reflect(I, N) {
    let temp = this.dot(I, N) * 2;
    return fastCalc((I, N, temp) => I - N * temp, I, N, temp);
  }

  // TODO check the correctness
  refract(I, N, eta) {
    let temp = this.dot(I, N);
    let k = 1 - eta * eta * (1 - temp * temp);

    if (k < 0) {
      return fastCalc((I) => I - I, I);
    }
    let r = eta * this.dot(I, N) + Math.sqrt(k);

    return fastCalc((I, N, eta, r) => I * eta - N * r, I, N, eta, r);
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

  vecFactory(args, Class, len) {
    const argsLen = args.length;
    if (!argsLen) {
      throw new Error(('empty vector args not supported by glsl'));
    }

    const array = [];
    for (let i = 0; i < argsLen; i += 1) {
      const arg = args[i];
      if (typeof arg === 'number') {
        array.push(arg);
      } else if (!arg) {
        throw new Error(`cant handle undefined arg ${arg}`);
      } else {
        if (arg instanceof this.options.Vec4) {
          array.push(arg.x, arg.y, arg.z, arg.w);
        } else if (arg instanceof this.options.Vec3) {
          array.push(arg.x, arg.y, arg.z);
        } else if (arg instanceof this.options.Vec2) {
          array.push(arg.x, arg.y);
        }
      }
    }

    if (Number.isNaN(array[0])) {
      throw new Error(('result cant be NaN'));
    }

    if (array.length === 1) {
      const first = array[0];
      return new Class(first, first, first, first);
    }

    if (array.length < len) {
      throw new Error(`assigned arg count is not enough, expected ${len} but got ${array.length}`);
    }
    return new Class(...array);
  }

  vec2(...args) {
    return this.vecFactory(args, this.options.Vec2, 2);
  }

  vec3(...args) {
    return this.vecFactory(args, this.options.Vec3, 3);
  }

  vec4(...args) {
    return this.vecFactory(args, this.options.Vec4, 4);
  }

  mat3(ax0, ax1, ax2) {
    return [ax0, ax1, ax2];
  }
}
