import { assert } from 'chai';
import { typ, fun, cls, string, number } from '../src';

describe('type tests', () => {


  // const f1 = (str = typ(string)) => {
  //   return parseFloat(str);
  // }
  // type bla = Parameters<(typeof f1)>;

  class Test {

  }

  it('should work with valid number declarations', () => {
    let nr1 = typ(number);

    assert.equal(nr1, undefined);

    nr1 = 5;

    let nr2 = typ(5);

    assert.equal(typeof nr1, 'number');
    assert.equal(typeof nr2, 'number');
  });

  it('should work with valid string declarations', () => {
    let str1 = typ(string);

    assert.equal(str1, undefined);

    str1 = 'hello';

    let str2 = typ('hello');

    assert.equal(typeof str1, 'string');
    assert.equal(typeof str2, 'string');
  });

  it('should work with valid type declarations', () => {
    let h1 = typ(Test);

    assert.equal(h1, undefined);

    h1 = new Test();

    let h2 = typ(new Test());

    assert.equal(h1 instanceof Test, true);

    assert.equal(typeof h2, 'object');
    assert.equal(h2 instanceof Test, true);
  });
});

describe('function tests', () => {

  class Test {

  }

  it('should work with valid function declarations', () => {
    const fn1 = fun(string, (p = typ(number)) => {
      return `hallo ${p}`
    });

    const res1 = fn1(5);
    assert.equal(res1, 'hallo 5');

    assert.throws(() => {
      fn1('string instead of number');
    });
  });

  it('should work with valid void function declarations', () => {
    let nr;
    const fn1 = fun((p = typ(number)) => {

      nr = p;
      console.log('hallo welt?!', p, nr);
    });

    const res1 = fn1(5);
    assert.equal(res1, undefined);
    assert.equal(nr, 5);
  });

  it('should not work with invalid function declarations', () => {
    assert.throws(() => {
      const fn = fun((p = typ(number)) => {
        return 'hello'
      });
      const bla = fn(5);
    });

    assert.throws(() => {
      fun(string, () => {
        return 5;
      })();
    });
  });

});

describe('class tests', () => {

  class Test {

  }

  it('should work with valid class declarations', () => {
    let Test = cls({
      bar: number,

      constructor: fun(function () {
        this.bar = 7;
      }),

      foo: fun(number, function (str = typ(string)) {
        return parseFloat(str);
      })
    })

    const test = new Test();
    const nr = test.foo('12');

    assert.equal(test.bar, 7);
    assert.equal(nr, 12);

    assert.throws(() => {
      test.foo(12);
    });
  });

  it('should not work with invalid class declarations', () => {

    assert.throws(() => {
      let Test = cls({
        bar: number,

        constructor: fun(function () {
          this.bar = '12';
        })
      })

      const test = new Test();
    });
  });

  it('should work with valid class as type usage', () => {
    let Test = cls({
      bar: number,

      constructor: fun(function () {
        this.bar = 7;
      }),

      foo: fun(number, function (str = typ(string)) {
        return parseFloat(str);
      })
    });

    const fn1 = fun(Test, () => {
      return new Test();
    });

    const test = fn1();
    assert.equal(typeof test, 'object');
    assert.equal(test instanceof Test, true);

    const fn2 = fun((test = typ(Test)) => {
      assert.equal(typeof test, 'object');
      assert.equal(test instanceof Test, true);
    });
    fn2(test);
  });

});
