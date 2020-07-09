const SAMPLER2D = Symbol('sampler 2d');

class Texture2D {
  constructor(source, w = source.width, h = source.height, bilinear = true) {
    this.source = source;
    this.bilinear = bilinear;
    this.w = w;
    this.h = h;

    this.bufferRef = {};
  }

  get(builtIn, pos) {
    const { w, h, bilinear } = this;
    let x = pos.x * w;
    let y = pos.y * h;

    x = (x + w) % w;
    y = (y + h) % h;
    let x0 = Math.floor(x);
    let x1 = (x0 + 1) % w;
    let y0 = Math.floor(y);
    let y1 = (y0 + 1) % h;

    if (Number.isNaN(x0)) {
      console.error(`wtf ${x} ${y}`);
      return 0;
    }

    if (!bilinear) {
      return this.getPixel(builtIn, x0, y0);
    }

    let changeX = x - x0;
    let changeY = y - y0;
    let overY0 = builtIn.mix(this.getPixel(builtIn, x0, y0), this.getPixel(builtIn, x0, y1), changeY);
    let overY1 = builtIn.mix(this.getPixel(builtIn, x1, y0), this.getPixel(builtIn, x1, y1), changeY);

    return builtIn.mix(overY0, overY1, changeX);
  }

  getPixel(builtIn, x, y) {
    const buffer = this.getBuffer();
    let index = (this.w * y + x) * 4;
    return builtIn.vec4(buffer[index] / 255, buffer[index + 1] / 255, buffer[index + 2] / 255, buffer[index + 3] / 255);
  }

  setPixel(x, y, color) {
    const buffer = this.getBuffer();
    let index = (this.w * y + x) * 4;
    buffer[index + 0] = Math.floor(color.x * 255.0);
    buffer[index + 1] = Math.floor(color.y * 255.0);
    buffer[index + 2] = Math.floor(color.z * 255.0);
    buffer[index + 3] = Math.floor(color.w * 255.0);
  }

  getBuffer() {
    let { buffer } = this.bufferRef;
    if (!buffer) {
      const { source, w, h } = this;
      if (typeof Image !== 'undefined' && source instanceof Image) {
        let cvs = document.createElement('canvas');
        cvs.width = w;
        cvs.height = h;
        let ctx = cvs.getContext('2d');
        ctx.drawImage(source, 0, 0);

        buffer = ctx.getImageData(0, 0, w, h).data;
      } else {
        buffer = source;
      }
      this.bufferRef.buffer = buffer;
    }
    return buffer;
  }

  set(builtIn, pos, color) {
    const { w, h } = this;
    let x = pos.x * w;
    let y = pos.y * h;

    x = (x + w) % w;
    y = (y + h) % h;
    let x0 = Math.floor(x);
    let y0 = Math.floor(y);

    if (Number.isNaN(x0)) {
      console.error(`wtf ${x} ${y}`);
      return 0;
    }

    this.setPixel(x0, y0, color);
  }
}

export function sampler2D(source, w, h, bilinear) {
  let texture = source[SAMPLER2D];
  if (!texture) {
    texture = new Texture2D(source, w, h, bilinear);
  }
  return texture;
}

export function renderToCanvas(canvas, pixelCall) {
  let group = canvas[SAMPLER2D];
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!group || group.w !== w || group.h !== h) {
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, w, h);

    const texture = sampler2D(data.data, w, h);
    group = {
      texture, w, h, data, ctx
    };
    canvas[SAMPLER2D] = group;
  }

  const multi = 10;
  for (let x = 0; x < w; x += multi) {
    for (let y = 0; y < h; y += multi) {
      const color = pixelCall(x / w, y / w);
      for (let i = 0; i < multi; i += 1) {
        for (let j = 0; j < multi; j += 1) {
          group.texture.setPixel(x + i, y + j, color);
        }
      }
    }
  }
  group.ctx.putImageData(group.data, 0, 0);
}
