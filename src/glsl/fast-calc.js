
let tmpArrays = [[], [], [], [], [], []];
const results = [new Array(1), new Array(2), new Array(3), new Array(4)];

export function prepare(Class, length) {
  const { prototype } = Class;

  if (length === 1) {
    prototype.__getDataCalc = function __getDataCalc(target, i) {
      const value = this.valueOf();
      target[0][i] = value;
      target[1][i] = value;
      target[2][i] = value;
      target[3][i] = value;
      target[4][i] = 1;
      target[5][i] = Class;
    };
  } else if (length === 2) {
    prototype.__getDataCalc = function __getDataCalc(target, i) {
      target[0][i] = this.x;
      target[1][i] = this.y;
      target[2][i] = 0.0;
      target[3][i] = 0.0;
      target[4][i] = 2;
      target[5][i] = Class;
    };
  } else if (length === 3) {
    prototype.__getDataCalc = function __getDataCalc(target, i) {
      target[0][i] = this.x;
      target[1][i] = this.y;
      target[2][i] = this.z;
      target[3][i] = 0.0;
      target[4][i] = 3;
      target[5][i] = Class;
    };
  } else if (length === 4) {
    prototype.__getDataCalc = function __getDataCalc(target, i) {
      target[0][i] = this.x;
      target[1][i] = this.y;
      target[2][i] = this.z;
      target[3][i] = this.w;
      target[4][i] = 4;
      target[5][i] = Class;
    };
  }
}

export function fastCalc(alg, ...args) {
  let max = 0;
  let MaxClass;

  const argsLen = args.length;
  for (let i = 0; i < argsLen; i += 1) {
    const arg = args[i];
    arg.__getDataCalc(tmpArrays, i);
    const m = tmpArrays[4][i];
    if (m > max) {
      max = m;
      MaxClass = tmpArrays[5][i];
    }
  }

  let result = results[max - 1];

  for (let i = 0; i < max; i += 1) {
    result[i] = alg.apply(null, tmpArrays[i]);
  }

  return new MaxClass(...result);
}
