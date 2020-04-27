import { assert } from 'chai';
import { buildGLSL } from '../../src/glsl';

describe('glsl tests', () => {
  it('glsl hello world works.', () => {
    const glsl = buildGLSL(() => {
      let foo = uniform(vec2);

      let bar = vec2((x = float, y = float) => {
        return vec2(x, y);
      })
    });

    const expected = `
uniform vec2 foo;
vec2 bar(float x, float y) {
\treturn vec2(x, y);
}
  `

    assert.equal(glsl.trim(), expected.trim());
  });
});
