import { assert } from 'chai';
import { buildGLSL, sampler2D, joinGLSL } from '../../src/glsl';

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
  buildGLSL(() => { return {} }, { glsl: false, js: jsOptions });

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

  it('works with calc.', () => {
    const shader = ({ vec2, float, calc }) => {
      let bar = vec2((x = float(), y = float()) => {
        return vec2(x, y);
      });

      let action = float((one = vec2(), two = vec2()) => {
        return calc(() => one * two);
      });

      return { bar, action };
    };
    const { glsl, js } = buildGLSL(shader, { js: true });

    const expected = `
vec2 bar(float x, float y) {
\treturn vec2(x, y);
}
float action(vec2 one, vec2 two) {
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
      let action = vec2((one = vec2(), two = vec2()) => {
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
      let bar = vec3((x = vec3(), y = vec3()) => {
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

  it('works fine with glsl swizzle.', () => {
    const shader = ({ vec3, vec2 }) => {
      let bar = vec3((x = vec2()) => {
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
      let bar = vec4((x = vec2()) => {
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

  it('works fine with glsl asin multiple types.', () => {
    const shader = ({ asin, vec2 }) => {
      let bar = vec2((x = vec2()) => {
        return asin(x);
      });
      return { bar };
    };
    const { js } = buildGLSL(shader, { js: true, glsl: false });

    const { bar } = js;

    const result = bar(new Vec2(0.1, 0.9));
    assert.closeTo(result.x, 0.1001674211615598, 0.00001);
    assert.closeTo(result.y, 1.1197695149986342, 0.00001);
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

    const shader = ({ texture, vec2, vec4, sampler2D }) => {
      let bar = vec4((image = sampler2D()) => {
        return texture(image, vec2(0.0, 0.0));
      });
      return { bar };
    };
    const { js } = buildGLSL(shader, { js: true, glsl: false });

    const { bar } = js;

    const result = bar(sampler);
    assert.equal(result.x, 1);
    assert.equal(result.y, 0);
    assert.equal(result.z, 0);
    assert.equal(result.w, 1);
  });

  it('works fine even with debug statements', () => {

    let warnRes;
    const warn = (arg) => warnRes = arg;

    const shader = ({ vec4, vec2 }) => {
      let bar = vec4((x = vec2()) => {
        warn(`warning: ${x.x.toPrecision(8)}`);
        return vec4(x, 1.0, 1.0);
      });
      return { bar };
    };
    const { js, glsl } = buildGLSL(shader, { js: true });

    const { bar } = js;

    const expected = `
vec4 bar(vec2 x) {
\t/* warn statement */
\treturn vec4(x, 1.0, 1.0);
}
`;

    assert.equal(glsl.trim(), expected.trim());

    const result = bar(new Vec2(3, 2));
    assert.equal(result.x, 3);
    assert.equal(result.y, 2);
    assert.equal(result.z, 1);
    assert.equal(result.w, 1);

    assert.equal(warnRes, 'warning: 3.0000000');
  });

  it('works fine with glsl struct', () => {
    const shader = ({ cls, vec2, float }) => {
      let Foo = cls({
        bar: vec2,
        zahl: float
      });
      let boom = Foo((x = float()) => {
        let foo = new Foo();
        foo.bar.x = x;
        foo.bar.y = 2.0;
        foo.zahl = 5.0;
        return foo;
      });
      let bar = Foo((x = float()) => {
        let foo = new Foo(boom(x))
        return foo;
      });
      return { bar };
    };
    const { js } = buildGLSL(shader, { js: true, glsl: false });

    const { bar } = js;

    const result = bar(1.0);
    assert.closeTo(result.bar.x, 1.0, 0.00001);
    assert.closeTo(result.bar.y, 2.0, 0.00001);
    assert.closeTo(result.zahl, 5.0, 0.00001);
  });

  it('works fine with joining glsl snippets', () => {
    const shader1 = ({ cls, vec2, float }) => {
      let Foo = cls({
        bar: vec2,
        zahl: float
      });
      return { Foo };
    };
    const shader2 = ({ vec2, Foo }) => {
      let bar = Foo(() => {
        let foo = new Foo();
        foo.bar = vec2(1.0, 2.0);
        foo.zahl = 5.0;
        return foo;
      });
      return { bar };
    };
    const one = buildGLSL(shader1, { glsl: false });
    const two = buildGLSL(shader2, { glsl: false });
    const mixed = joinGLSL([one, two], { js: true, glsl: false });
    const { js } = mixed;

    const { bar, Foo } = js;

    const result = bar();
    assert.closeTo(result.bar.x, 1.0, 0.00001);
    assert.closeTo(result.bar.y, 2.0, 0.00001);
    assert.closeTo(result.zahl, 5.0, 0.00001);

    assert.isDefined(Foo);

    const shader3 = buildGLSL(({ vec2, bar }) => {
      let baz = vec2(() => {
        return bar(1.0).bar;
      });
      return { baz };
    });

    const { js: { baz } } = joinGLSL([mixed, shader3], { js: true, glsl: false });

    const result2 = baz();
    assert.closeTo(result2.x, 1.0, 0.00001);
    assert.closeTo(result2.y, 2.0, 0.00001);
  });

  it('works fine with bool', () => {
    const { js: { bar } } = buildGLSL(({ bool }) => {
      let bar = bool(() => {
        return true;
      });
      return { bar };
    }, { js: true });
    const result = bar();
    assert.equal(result, true);
  });

  it('works fine with Number class', () => {
    const { js: { bar } } = buildGLSL(({ vec2, float, floor }) => {
      let bar = vec2(() => {
        let x = float(floor(3.0));
        let y = float(floor(4.5));
        return vec2(x, y);
      });
      return { bar };
    }, { js: true });
    const result = bar();
    assert.closeTo(result.x, 3.0, 0.00001);
    assert.closeTo(result.y, 4.0, 0.00001);
  });

  it('works with set unifom parameter.', () => {
    const { js: { foo, bar, setParam } } = buildGLSL(({ uniform, calc, vec2 }) => {
      const foo = uniform(vec2);

      let bar = vec2(() => {
        return foo;
      });

      return { foo, bar };
    }, { js: true });

    setParam(foo, new Vec2(3, 2));
    const result2 = bar();
    assert.closeTo(result2.x, 3.0, 0.00001);
    assert.closeTo(result2.y, 2.0, 0.00001);

  });

  it('works fine with glsl default init variable', () => {
    const shader = ({ vec2 }) => {
      let bar = vec2(() => {
        return vec2();
      });
      return { bar };
    };
    const { js } = buildGLSL(shader, { js: true, glsl: false });

    const { bar } = js;

    const result = bar();
    assert.equal(result.x, 0);
    assert.equal(result.y, 0);
  });

  // it('throws an error when trying to change props of an argument.', () => {
  //   const shader = ({ asin, vec2 }) => {
  //     let bar = (x = vec2()) => {
  //       console.log('x???', x, x.x);
  //       x.x = 0.5;
  //       console.log('x???', x.x);
  //     };
  //     return { bar };
  //   };
  //   const { js } = buildGLSL(shader, { js: true, glsl: false });

  //   const { bar } = js;

  //   assert.throws(() => (bar(new Vec2(0.1, 0.9))));
  // });

  // it('throws an arrow when assigning wrong type to function.', () => {
  //   const shader = ({ asin, vec2 }) => {
  //     let bar = (x = vec2()) => {
  //       x.x * 5.0;
  //     };
  //     return { bar };
  //   };
  //   const { js } = buildGLSL(shader, { js: true, glsl: false });

  //   const { bar } = js;

  //   assert.throws(() => (bar(new Vec3(0.1, 0.9, 5.0))));
  // });
});
