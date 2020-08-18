
const KEYS = ['x', 'y', 'z', 'w'];

function prep(prototype, Class, ...keys) {
  Object.defineProperty(prototype, keys.join(''), {
    get() {
      return new Class(...keys.map((k) => this[k]));
    },
    set(value) {
      keys.map((k, i) => this[k] = value[KEYS[i]]);
      return true;
    }
  });
}

function prepare(Class, { Vec2, Vec3, Vec4 }, keysVec, keysCol) {
  const { prototype } = Class;
  const keys = [...keysVec, ...keysCol];

  keysVec.forEach((keyVec, i) => {
    Object.defineProperty(prototype, keysCol[i], {
      get() {
        return this[keyVec];
      },
      set(value) {
        this[keyVec] = value;
        return true;
      }
    });
  });

  keys.forEach((a) => keys.forEach((b) => prep(prototype, Vec2, a, b)));

  keys.forEach((a) => keys.forEach((b) => keys.forEach((c) => prep(prototype, Vec3, a, b, c))));

  keys.forEach((a) => keys.forEach((b) => keys.forEach((c) => keys.forEach((d) => prep(prototype, Vec4, a, b, c, d)))));

}

export function swizzle(options) {

  prepare(options.Vec2, options, ['x', 'y'], ['r', 'g']);
  prepare(options.Vec3, options, ['x', 'y', 'z'], ['r', 'g', 'b']);
  prepare(options.Vec4, options, ['x', 'y', 'z', 'w'], ['r', 'g', 'b', 'a']);

}
