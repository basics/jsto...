import { assert } from 'chai';
import {buildGLSL, sampler2D, swizzle } from '../../src/glsl';

const MOCKED = 777654321;

describe('glsl tests', () => {

  function calcSim(alg) {
    alg();
    return MOCKED;
  }

  function multiplySim(a, b) {
    return a.x * b.x;
  }

  class Vec2 {
    constructor(x = 0, y = x) {
      this.x = x;
      this.y = y;
    }
    valueOf() {
      return 5;
    }
  }

  class Vec3 {
    constructor(x = 0, y = x, z = y) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    valueOf() {
      return 5;
    }
  }

  class Vec4 {
    constructor(x = 0, y = x, z = y, w = z) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.w = w;
    }
    valueOf() {
      return 5;
    }
  }

  const jsOptions = {
    multiply: multiplySim,
    Vec2, Vec3, Vec4,
    calc: calcSim
  };
  buildGLSL(() => {}, { glsl: false, js: jsOptions });

  it('works glsl vectors.', () => {
    const shader = ({ vec2 }) => {
      let bar = vec2(() => {
        return vec2(vec2(1.0, 2.0));
      });
      return { bar };
    };
    const { glsl, js } = buildGLSL(shader, { js: true });

    const expected = `
vec2 bar() {
\treturn vec2(vec2(1.0, 2.0));
}
`;

    assert.equal(glsl.trim(), expected.trim());

    const { bar } = js;

    const result = bar();

    assert.equal(result.x, 1);
    assert.equal(result.y, 2);
  });

  it('worlds with calc.', () => {
    const shader = ({ vec2, float, calc }) => {
      let bar = vec2((x = float, y = float) => {
        return vec2(x, y);
      });

      let action = vec2((one = vec2, two = vec2) => {
        return calc(() => one * two);
      });

      return { bar, action };
    };
    const { glsl, js } = buildGLSL(shader, { js: true });

    const expected = `
vec2 bar(float x, float y) {
\treturn vec2(x, y);
}
vec2 action(vec2 one, vec2 two) {
\treturn (one * two);
}
`;

    assert.equal(glsl.trim(), expected.trim());

    const { bar, action } = js;

    const result = bar(1, 2);

    assert.equal(result.x, 1);
    assert.equal(result.y, 2);

    const a = action(result, result);

    assert.equal(a, MOCKED);
  });

  it('works with glsl calc as factory call.', () => {
    const shader = ({ vec2, calc }) => {
      let action = vec2((one = vec2, two = vec2) => {
        let res = vec2(calc(() => one * two));
        return res;
      });

      return { action };
    };
    const { js } = buildGLSL(shader, { js: true });

    const { action } = js;

    const result = new Vec2(1, 2);
    const a = action(result, result);

    assert.equal(a.x, MOCKED);
    assert.equal(a.y, MOCKED);
  });

  it('works fine with glsl builtIn.', () => {
    const shader = ({ vec3, cross }) => {
      let bar = vec3((x = vec3, y = vec3) => {
        return cross(x, y);
      });
      return { bar };
    };
    const { js } = buildGLSL(shader, { js: true, glsl: false });

    const { bar } = js;

    const result = bar(new Vec3(3, 0, 0), new Vec3(1, 1, 1));
    assert.equal(result.x, 0);
    assert.equal(result.y, -3);
    assert.equal(result.z, 3);
  });

  it('works fine with multiply.', () => {
    const shader = ({ vec3, multiply }) => {
      let bar = vec3((x = vec3, y = vec3) => {
        return multiply(x, y);
      });
      return { bar };
    };
    const { js, glsl } = buildGLSL(shader, { js: true });

    const expected = `
vec3 bar(vec3 x, vec3 y) {
\treturn (x * y);
}
`;

    assert.equal(glsl.trim(), expected.trim());

    const { bar } = js;

    const result = bar(new Vec3(3, 4, 5), new Vec3(1, 7, 9));
    assert.equal(result, 3);
  });

  it('works fine with glsl swizzle.', () => {
    const shader = ({ vec3, vec2 }) => {
      let bar = vec3((x = vec2) => {
        return x.xxy;
      });
      return { bar };
    };
    const { js } = buildGLSL(shader, { js: true, glsl: false });

    const { bar } = js;

    const result = bar(new Vec2(3, 1));
    assert.equal(result.x, 3);
    assert.equal(result.y, 3);
    assert.equal(result.z, 1);
  });

  it('works fine with glsl flexible vector factories.', () => {
    const shader = ({ vec4, vec2 }) => {
      let bar = vec4((x = vec2) => {
        return vec4(x, 1.0, 1.0);
      });
      return { bar };
    };
    const { js } = buildGLSL(shader, { js: true, glsl: false });

    const { bar } = js;

    const result = bar(new Vec2(3, 2));
    assert.equal(result.x, 3);
    assert.equal(result.y, 2);
    assert.equal(result.z, 1);
    assert.equal(result.w, 1);
  });

  //  vec4(calc(() => (uv % 0.05) * 20.0), 1.0, 1.0),

  // it('works fine with flexible vec parameters.', () => {
  //   const shader = ({ vec4, vec3, vec2 }) => {
  //     let bar = vec3((x = vec2) => {
  //       return vec4(x.xy, 0.0, 1.0);
  //     });
  //     return { bar };
  //   };
  //   const { js } = buildGLSL(shader, { js: true, glsl: false });
  //
  //   const { bar } = js;
  //
  //   const result = bar(new Vec2(3, 1));
  //   assert.equal(result.x, 3);
  //   assert.equal(result.y, 3);
  //   assert.equal(result.z, 0);
  //   assert.equal(result.w, 1);
  // });

  it('works fine with sampler2D from array buffer.', () => {

    const buffer = new Uint8ClampedArray(2 * 1 * 4);
    // red
    buffer[0] = 255;
    buffer[3] = 255;

    // green
    buffer[5] = 255;
    buffer[7] = 255;

    const sampler = sampler2D(buffer, 2, 1, false);

    const shader = ({ texture, vec2, vec4 }) => {
      let bar = vec4((image) => {
        return texture(image, vec2(0.0, 0.0));
      });
      return { bar };
    };
    const { js } = buildGLSL(shader, { js: true, glsl: false });

    const { bar } = js;

    const result = bar(sampler);
    console.log('result', result);
    assert.equal(result.x, 1);
    assert.equal(result.y, 0);
    assert.equal(result.z, 0);
    assert.equal(result.w, 1);
  });
});
