// impl copied from
// https://github.com/burg/glsl-simulator/blob/master/lib/runtime/builtins.js

/* global calc */

export class BuiltIn {

  radians(degrees) {
    return calc(() => degrees / (180 * Math.PI));
  }

  degrees(radians) {
    return calc(() => radians / (180 * Math.PI));
  }

  sin(x) {
    return calc(() => Math.sin(x));
  }

  cos(x) {
    return calc(() => Math.cos(x));
  }

  tan(x) {
    return calc(() => Math.tan(x));
  }

  asin(x) {
    return calc(() => Math.asin(x));
  }

  acos(x) {
    return calc(() => Math.acos(x));
  }

  atan(y, x) {
    return calc(() => {
      if (x === undefined || x === null) {
        return Math.atan(y);
      }
      return Math.atan2(y, x);
    });
  }

  pow(x, y) {
    return calc(() => x ** y);
  }

  exp(x) {
    return calc(() => Math.exp(x));
  }

  log(x) {
    return calc(() => Math.log(x));
  }

  exp2(x) {
    return calc(() => 2 ** x);
  }

  log2(x) {
    return calc(() => Math.log(x) / Math.log(2));
  }

  sqrt(x) {
    return calc(() => Math.sqrt(x));
  }

  inversesqrt(x) {
    return calc(() => 1 / Math.sqrt(x));
  }

  abs(x) {
    return calc(() => (x >= 0 ? x : -x));
  }

  sign(x) {
    return calc(() => (x > 0 ? 1 : -1));
  }

  floor(x) {
    return calc(() => Math.floor(x));
  }

  ceil(x) {
    return calc(() => Math.ceil(x));
  }

  fract(x) {
    return calc(() => x - Math.floor(x));
  }

  min(x, y) {
    return calc(() => Math.min(x, y));
  }

  max(x, y) {
    return calc(() => Math.max(x, y));
  }

  clamp(x, minVal, maxVal) {
    return calc(() => {
      if (minVal > maxVal) {
        throw new Error('clamp(): maxVal must be larger than minVal.');
      }
      return Math.min(Math.max(x, minVal), maxVal);
    });
  }

  mix(x, y, alpha) {
    return calc(() => alpha * x + (1 - alpha) * y);
  }

  step(edge, x) {
    return calc(() => (x < edge ? 0 : 1));
  }

  smoothstep(edge0, edge1, x) {
    return calc(() => {
      const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
      return t * t * (3 - 2 * t);
    });
  }

  length(v) {
    let collect = 0;
    calc(() => (collect += v * v));
    return Math.sqrt(collect);
  }

  distance(x, y) {
    return this.length(calc(() => x - y));
  }

  dot(x, y) {
    let collect = 0;
    calc(() => collect += x * y);
    return collect;
  }

  normalize(x) {
    const len = this.length(x);
    if (len <= Number.EPSILON) {
      return x;
    }
    return calc(() => x / len);
  }

  cross(x, y) {
    return new x.constructor(
      x.y * y.z - x.z * y.y,
      x.z * y.x - x.x * y.z,
      x.x * y.y - x.y * y.x
    );
  }

  faceforward(N, I, Nref) {
    if (this.dot((Nref, I)) < 0) {
      return N;
    }
    return calc(() => N * -1);
  }

  reflect(I, N) {
    let temp = this.dot(I, N) * 2;
    return calc(() => I - N * temp);
  }

  // TODO check the correctness
  refract(I, N, eta) {
    let temp = this.dot(I, N);
    let k = 1 - eta * eta * (1 - temp * temp);

    if (k < 0) {
      return calc(() => I - I);
    }
    let r = eta * this.dot(I, N) + Math.sqrt(k);

    return calc(() => I * eta - N * r);
  }
}
