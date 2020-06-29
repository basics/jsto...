import { assert } from 'chai';
import { buildGLSL } from '../../src/glsl';

describe('glsl tests', () => {

  function vec2Sim(x = 0, y = x) {
    return { x, y, valueOf() { return 5; } };
  }
  function calcSim(alg) {
    return `only mocked ${alg()}`;
  }
  const jsOptions = {
    vec2: vec2Sim,
    calc: calcSim
  };
  buildGLSL(() => {}, { glsl: false, js: jsOptions });

  it('glsl hello world works.', () => {
    const shader = () => {
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
\treturn one * two;
}
`;

    assert.equal(glsl.trim(), expected.trim());

    const { bar, action } = js;

    const result = bar(1, 2);

    assert.equal(result.x, 1);
    assert.equal(result.y, 2);

    const a = action(result, result);

    assert.equal(a, 'only mocked 25');
  });
});
