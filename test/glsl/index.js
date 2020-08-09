import { assert } from 'chai';
import { buildGLSL, sampler2D, joinGLSL } from '../../src/glsl';

describe('glsl tests', () => {
  it('glsl hello world works.', () => {
    const { glsl } = buildGLSL(() => {
      let foo = uniform(vec2);

      let bar = vec2((x = vec2, y = float) => {
        x = normalize(x);
        return vec2(x.x, y);
      });
    });

    const expected = `
uniform vec2 foo;
vec2 bar(vec2 x, float y) {
\tx = normalize(x);
\treturn vec2(x.x, y);
}
  `;

    assert.equal(glsl.trim(), expected.trim());
  });

  it('works with glsl inline type', () => {
    const { glsl } = buildGLSL(() => {
      let baz = vec2(() => {
        let foo = vec2(5.0, 1.0);
        return foo;
      });
    });

    const expected = `
vec2 baz() {
\tvec2 foo = vec2(5.0, 1.0);
\treturn foo;
}
    `;

    assert.equal(glsl.trim(), expected.trim());
  });

  it('works with glsl inline type with indirect default call', () => {
    const { glsl } = buildGLSL(() => {
      let baz = float(() => {
        let foo = float(makeFloat());
        return foo;
      });
    });

    const expected = `
float baz() {
\tfloat foo = float(makeFloat());
\treturn foo;
}
    `;

    assert.equal(glsl.trim(), expected.trim());
  });

  it('throw an error when trying to use default parameters.', () => {
    assert.throws(() => {
      buildGLSL(() => {
        let bar = vec2((x = vec2(1.0, 2.0)) => {
          x = normalize(x);
          return vec2(x.x, y);
        })
      });
    });
  });

  it('works with local operator.', () => {
    const { glsl } = buildGLSL(() => {
      let baz = (x = vec2) => {
        x += 5.0;
      };
    });

    const expected = `
void baz(vec2 x) {
\tx += 5.0;
}
  `;

    assert.equal(glsl.trim(), expected.trim());
  });

  it('works with glsl only type definition type', () => {
    const { glsl } = buildGLSL(() => {
      let baz = vec2(() => {
        let foo = vec2;
        foo.x = 5.0;
        foo.y = 1.0;
        return foo;
      });
    });

    const expected = `
vec2 baz() {
\tvec2 foo;
\tfoo.x = 5.0;
\tfoo.y = 1.0;
\treturn foo;
}
    `;

    assert.equal(glsl.trim(), expected.trim());
  });

  it('extract type and init from implicit combinations', () => {
    const { glsl } = buildGLSL(() => {
      let baz = float(() => {
        let foo = float(texture2D(lastBuffer, x).a * 1000.0);
        return foo;
      });
    });

    const expected = `
float baz() {
\tfloat foo = float(texture2D(lastBuffer, x).a * 1000.0);
\treturn foo;
}
    `;

    assert.equal(glsl.trim(), expected.trim());
  });

  it('extract type and init from implicit combinations', () => {
    const { glsl } = buildGLSL(() => {
      let baz = MyType(() => {
        let foo = MyType(lastBuffer);
        return foo;
      });
    });

    const expected = `
MyType baz() {
\tMyType foo; foo = lastBuffer;
\treturn foo;
}
    `;

    assert.equal(glsl.trim(), expected.trim());
  });

  it('works with struct', () => {
    const { glsl } = buildGLSL(() => {
      let MyType = cls({
        fNormal: vec3,
        vNormal: vec3
      });

      let foo = MyType;
    });

    const expected = `
struct MyType { vec3 fNormal; vec3 vNormal; };
MyType foo;
    `;

    assert.equal(glsl.trim(), expected.trim());
  });

  it('works with joining chunks', () => {
    const one = buildGLSL(() => {
      let foo = uniform(vec2);
    });

    const two = buildGLSL(() => {
      let bar = vec2((x = vec2, y = float) => {
        x = normalize(x);
        return vec2(x.x, y);
      });
    });

    const { glsl } = joinGLSL([one, two]);

    const expected = `
uniform vec2 foo;

vec2 bar(vec2 x, float y) {
\tx = normalize(x);
\treturn vec2(x.x, y);
}
    `;


    assert.equal(glsl.trim(), expected.trim());
  });

});
