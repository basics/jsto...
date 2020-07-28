
function prep(prototype, Class, ...keys) {
  Object.defineProperty(prototype, keys.join(''), {
    get() {
      return new Class(...keys.map((k) => this[k]));
    }
  });
}

function prepare(Class, { Vec2, Vec3, Vec4 }, keys) {
  const { prototype } = Class;

  keys.forEach((a) => keys.forEach((b) => prep(prototype, Vec2, a, b)));

  keys.forEach((a) => keys.forEach((b) => keys.forEach((c) => prep(prototype, Vec3, a, b, c))));

  keys.forEach((a) => keys.forEach((b) => keys.forEach((c) => keys.forEach((d) => prep(prototype, Vec4, a, b, c, d)))));

}

export function swizzle(options) {

  prepare(options.Vec2, options, ['x', 'y']);
  prepare(options.Vec3, options, ['x', 'y', 'z']);
  prepare(options.Vec4, options, ['x', 'y', 'z', 'w']);

}
