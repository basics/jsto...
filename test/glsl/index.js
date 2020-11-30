// @ts-nocheck
import { assert } from 'chai';
import { buildGLSL, joinGLSL } from '../../src/glsl';

describe('glsl tests', () => {
  it('glsl hello world works.', () => {
    const { glsl } = buildGLSL(() => {
      let foo = uniform(vec2);

      let bar = vec2((x = vec2(), y = float()) => {
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
        });
      });
    });
  });

  it('works with local operator.', () => {
    const { glsl } = buildGLSL(() => {
      let baz = (x = vec2()) => {
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
        let foo = vec2();
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
        let foo = new MyType(lastBuffer);
        return foo;
      });
    });

    const expected = `
MyType baz() {
\tMyType foo = lastBuffer;
\treturn foo;
}
    `;

    assert.equal(glsl.trim(), expected.trim());
  });

  it('extract void function', () => {
    const { glsl } = buildGLSL(() => {
      let main = fun(() => {

      });
    });

    const expected = `
void main() {

}
    `;

    assert.equal(glsl.trim(), expected.trim());
  });

  it('works with struct', () => {
    const { glsl } = buildGLSL(() => {
      const MyType = cls({
        fNormal: vec3,
        vNormal: vec3
      });
    });

    const expected = `
struct MyType { vec3 fNormal; vec3 vNormal; };
    `;

    assert.equal(glsl.trim(), expected.trim());
  });

  it('works with struct init call', () => {
    const { glsl } = buildGLSL(() => {
      let foo = MyType();
      let bar = new MyType();
    });

    const expected = `
MyType foo;
MyType bar;
    `;

    assert.equal(glsl.trim(), expected.trim());
  });

  it('works with mat access arrays', () => {
    const { glsl } = buildGLSL(() => {
      let foo = mat4(1.0);
      let x = int(3);
      let bar = float(foo[x][1]);
    });

    const expected = `
mat4 foo = mat4(1.0);
int x = int(3);
float bar = float(foo[x][1]);
      `;

    assert.equal(glsl.trim(), expected.trim());
  });

  it('works with float arrays', () => {
    const { glsl } = buildGLSL(() => {
      let foo = float([1.0, 2.0]);
    });

    const expected = `
float[2] foo; foo[0] = 1.0; foo[1] = 2.0;
      `;

    assert.equal(glsl.trim(), expected.trim());
  });

  it('works with vec arrays', () => {
    const { glsl } = buildGLSL(() => {
      let foo = vec2([vec2(1.0, 2.0), vec(3.0, 4.0)]);
    });

    const expected = `
vec2[2] foo; foo[0] = vec2(1.0, 2.0); foo[1] = vec(3.0, 4.0);
      `;

    assert.equal(glsl.trim(), expected.trim());
  });

  it('works with joining chunks', () => {
    const one = buildGLSL(() => {
      let foo = uniform(vec2);
    });

    const two = buildGLSL(() => {
      let bar = vec2((x = vec2(), y = float()) => {
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


  it('throw an error when type is forgotten.', () => {
    assert.throws(() => {
      buildGLSL(() => {
        let bar = vec2((x = vec2()) => {
          let y = normalize(x) * 10.0;
          return vec2(x.x, y);
        });
      });
    });
  });

  it('const handling works.', () => {
    const { glsl } = buildGLSL(() => {
      const foo = uniform(vec2(0.0));
      const bar = vec2(0.0);
      let baz = vec2(0.0);

      const fnFloat = float(() => {
        return 5.0;
      });

      const fnFVoid = () => {
        5.0 + 7.0;
      };
    });

    const expected = `
uniform vec2 foo = vec2(0.0);
const vec2 bar = vec2(0.0);
vec2 baz = vec2(0.0);
float fnFloat() {
\treturn 5.0;
}
void fnFVoid() {
\t5.0 + 7.0;
}
  `;
    assert.equal(glsl.trim(), expected.trim());
  });

  it('interpret gentype works.', () => {
    const { glsl, ast } = buildGLSL(() => {
      const foo = gentype((x = gentype()) => {
        let res = gentype(x * 5.0);
        return res;
      });
    });

    const expected = `
gentype foo(gentype x) {
\tgentype res = x * 5.0;
\treturn res;
}
  `;
    assert.equal(glsl.trim(), expected.trim());
  });

  it('works glsl 3.0 in and out.', () => {
    const { glsl } = buildGLSL(() => {
      let foo = input(vec2);

      let bar = output(vec2);

      let baz = (x = vec2(), y = float()) => {
        x = normalize(x);
        bar = x;
      };
    });

    const expected = `
in vec2 foo;
out vec2 bar;
void baz(vec2 x, float y) {
\tx = normalize(x);
\tbar = x;
}
  `;

    assert.equal(glsl.trim(), expected.trim());
  });

  it('works with merging multiple main functions', () => {
    const one = buildGLSL(() => {
      let main = fun(() => {
        const foo = vec2(1.0);
      });
    });

    const two = buildGLSL(() => {
      let main = fun(() => {
        const bar = vec2(1.0);
      });
    });

    const { glsl } = joinGLSL([one, two]);

    const expected = `
void main() {
\tconst vec2 foo = vec2(1.0);
\tconst vec2 bar = vec2(1.0);
}
    `;

    assert.equal(glsl.trim(), expected.trim());
  });

  it('works with glsl autodetect type calling function', () => {
    const { glsl } = buildGLSL(() => {
      let baz = float(() => {
        let foo = float(makeFloat());
        return foo;
      });

      let bar = baz();
    });

    const expected = `
float baz() {
\tfloat foo = float(makeFloat());
\treturn foo;
}
float bar = baz();
    `;

    assert.equal(glsl.trim(), expected.trim());
  });

  it('works with joining chunks auto detection', () => {
    const one = buildGLSL(() => {
      let foo = uniform(vec2);
    });

    const two = buildGLSL(() => {
      let bar = vec2(() => {
        let res = foo;
        return res;
      });
    });

    const { glsl } = joinGLSL([one, two]);

    const expected = `
uniform vec2 foo;
vec2 bar() {
\tvec2 res = foo;
\treturn res;
}
    `;


    assert.equal(glsl.trim(), expected.trim());
  });

  it('works when joining already joined properties', () => {
    const one = buildGLSL(() => {
      const foo = vec2(1.0);
    });

    const two = buildGLSL(() => {
      const bar = vec2(1.0);
    });

    const three = buildGLSL(() => {
      let baz = input(vec2(1.0));
    });

    const joined = joinGLSL([one, two]);
    const { glsl } = joinGLSL([joined, three]);

    const expected = `
const vec2 foo = vec2(1.0);
const vec2 bar = vec2(1.0);
in vec2 baz = vec2(1.0);
    `;

    assert.equal(glsl.trim(), expected.trim());
  });
});
