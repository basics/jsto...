import { assert } from 'chai';
import { cls, fun, number, string, boolean, typ } from '../src';

describe('type safety tests', () => {

  const string1 = typ(string);
  const string2 = typ(String);
  const string3 = typ('hallo');

  const number1 = typ(number);
  const number2 = typ(Number);
  const number3 = typ(55);

  const bool1 = typ(boolean);
  const bool2 = typ(Boolean);
  const bool3 = typ(true);

  const C = cls(class {

    h = typ(string);

    constructor(hello = typ(string)) {
      this.he = hello;
    }

    hallo = fun(string, (hello = typ(string)) => {

      return hello;
    });
  });

  const fun1 = fun(string, (str = typ(string), num = typ(number)) => {

    return str;
  });

  const c = new C('blub');

  it('tests valid typings', () => {

    const hello = fun1('hello', 2);

    assert.equal(hello, 'hello');

    const world = c.hallo('world');

    assert.equal(world, 'world');

    c.h = 'foo';

    assert.equal(c.h, 'foo');
  });

  it('throw errors on invalid typings', () => {

    assert.throws(() => {
      const funBroken = fun(number, (str = typ(string), blub = typ(number)) => {

        return 'bar';
      });
      funBroken('1', 2);
    });

    assert.throws(() => {
      fun1('', 2, 3);
    });

    assert.throws(() => {
      c.foo('');
    });

    assert.throws(() => {
      c.hallo(1, 2);
    });

    assert.throws(() => {
      const c2 = new C(1);
    });

    assert.throws(() => {
      const c2 = new C('');

      c2.h = 1;
    });
  });
});
