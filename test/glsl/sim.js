import { assert } from 'chai';
import { buildGLSL } from '../../src/glsl';

describe('glsl tests', () => {

  function calcSim(alg) {
    return `only mocked ${alg()}`;
  }

  class vec2Class {
    constructor(x = 0, y = x) {
      this.x = x;
      this.y = y;
    }
    valueOf() {
      return 5;
    }
  }

  class vec3Class {
    constructor(x = 0, y = x, z = y) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    valueOf() {
      return 5;
    }
  }

  function vec3(x, y, z) {
    return new vec3Class(x, y, z);
  }

  function vec2(x, y) {
    return new vec2Class(x, y);
  }

  const jsOptions = {
    vec3,
    vec2,
    calc: calcSim
  };
  buildGLSL(() => {}, { glsl: false, js: jsOptions });

  it('glsl hello world works.', () => {
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

  it('glsl builtIn function work.', () => {
    const shader = ({ vec3, cross }) => {
      let bar = vec3((x = vec3, y = vec3) => {
        return cross(x, y);
      });
      return { bar };
    };
    const { js } = buildGLSL(shader, { js: true, glsl: false });

    const { bar } = js;

    const result = bar(vec3(3, 0, 0), vec3(1, 1, 1));
    assert.equal(result.x, 0);
    assert.equal(result.y, -3);
    assert.equal(result.z, 3);
  });
});
