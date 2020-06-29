import { assert } from 'chai';
import { buildGLSL } from '../../src/glsl';

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

  it('glsl inline type handling works.', () => {
    const { glsl } = buildGLSL(() => {
      let baz = vec2(() => {
        let foo = vec2(5.0, 1.0);
        return foo;
      });
    });

    const expected = `
vec2 baz() {
\tvec2 foo = vec2; foo = vec2(5.0, 1.0);
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
});
