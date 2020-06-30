
export function sw(vecs) {
  const factories = vecs.map(
    (vec) => (x, y, z, w) => (
      new Proxy(vec(x, y, z, w), {
        get(target, key) {
          let res = target[key];
          if (res !== undefined) {
            return res;
          }
          const keyLen = key.length;
          if (keyLen === undefined || keyLen < 1 || keyLen > 4) {
            return undefined;
          }

          let args = key.split('').map((k) => {
            const v = target[k];
            if (typeof v !== 'number') {
              throw new Error(`swizzle no number found behind ${k}`);
            }
            return v;
          });
          return factories[keyLen - 2].apply(null, args);
        }
      })
    )
  );
  return factories;
}

export function swizzle(vecs) {
  const [vec2, vec3, vec4] = sw([vecs.vec2, vecs.vec3, vecs.vec4]);
  return { vec2, vec3, vec4 };
}
