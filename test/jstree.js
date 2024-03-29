import { assert } from 'chai';
import { parse } from '../src/jstree';

describe('jstree explicit tests', () => {

  it('extract type from explicit VariableDeclarator', () => {
    const node = parse('let x = type(String);');

    const [declarator] = node.body[0].declarations;
    const { id, init } = declarator;

    assert.equal(id.type, 'Identifier');
    assert.equal(id.typeAnnotation, 'String');
    assert.equal(id.name, 'x');
    assert.equal(id.qualifier, null);
    assert.equal(init, null);
  });

  it('extract type and init from explicit VariableDeclarator', () => {
    const node = parse('let x = type(String("foo"));');

    const [declarator] = node.body[0].declarations;
    const { id, init } = declarator;

    assert.equal(init.type, 'CallExpression');
    assert.equal(init.callee.name, 'String');
    assert.equal(init.arguments[0].value, 'foo');

    assert.equal(id.type, 'Identifier');
    assert.equal(id.typeAnnotation, 'String');
    assert.equal(id.name, 'x');
    assert.equal(id.qualifier, null);
  });

  it('extract typed function from explicit VariableDeclarator', () => {
    const node = parse('let x = fun(String, () => undefined);');

    const [declarator] = node.body[0].declarations;
    const { id, init } = declarator;

    assert.equal(init.type, 'ArrowFunctionExpression');
    assert.equal(init.returnType, 'String');
    assert.equal(id.name, 'x');
    assert.equal(id.qualifier, null);
  });

  it('extract typed function from explicit VariableDeclarator', () => {
    const node = parse('let x = fun(String, function(){});');

    const [declarator] = node.body[0].declarations;
    const { id, init } = declarator;

    assert.equal(init.type, 'FunctionExpression');
    assert.equal(init.returnType, 'String');
    assert.equal(id.name, 'x');
    assert.equal(id.qualifier, null);
  });

  it('extract typed argument from explicit AssignmentPattern', () => {
    const node = parse('let x = String((y = type(String)) => undefined);');

    const [declarator] = node.body[0].declarations;
    const { init } = declarator;
    const [arg] = init.params;

    assert.equal(arg.type, 'Identifier');
    assert.equal(arg.typeAnnotation, 'String');
    assert.equal(arg.name, 'y');
  });

  it('extract typed argument and its "right" from explicit AssignmentPattern', () => {
    const node = parse('let x = String((y = type(String("foo"))) => undefined);');

    const [declarator] = node.body[0].declarations;
    const { init } = declarator;
    const [arg] = init.params;
    const { left, right } = arg;

    assert.equal(arg.type, 'AssignmentPattern');
    assert.equal(left.type, 'Identifier');
    assert.equal(left.typeAnnotation, 'String');
    assert.equal(left.name, 'y');
    assert.equal(right.value, 'foo');
  });

  it('extract typed argument and its "right" from explicit AssignmentPattern', () => {
    const node = parse('let x = String(function (y = type(String("foo"))) {} );');

    const [declarator] = node.body[0].declarations;
    const { init } = declarator;
    const [arg] = init.params;
    const { left, right } = arg;

    assert.equal(arg.type, 'AssignmentPattern');
    assert.equal(left.type, 'Identifier');
    assert.equal(left.typeAnnotation, 'String');
    assert.equal(left.name, 'y');
    assert.equal(right.value, 'foo');
  });

});

describe('jstree implicit tests', () => {

  it('extract type from implicit VariableDeclarator', () => {
    const node = parse('let x = String;');

    const [declarator] = node.body[0].declarations;
    const { id, init } = declarator;

    assert.equal(id.type, 'Identifier');
    assert.equal(id.typeAnnotation, 'String');
    assert.equal(id.name, 'x');
    assert.equal(id.qualifier, null);
    assert.equal(init, null);
  });

  it('extract type and init from implicit VariableDeclarator', () => {
    const node = parse('let x = String("foo");');

    const [declarator] = node.body[0].declarations;
    const { id, init } = declarator;

    assert.equal(init.type, 'CallExpression');
    assert.equal(init.callee.name, 'String');
    assert.equal(init.arguments[0].value, 'foo');

    assert.equal(id.type, 'Identifier');
    assert.equal(id.typeAnnotation, 'String');
    assert.equal(id.name, 'x');
    assert.equal(id.qualifier, null);
  });

  it('extract typed function from implicit VariableDeclarator', () => {
    const node = parse('let x = String(() => undefined);');

    const [declarator] = node.body[0].declarations;
    const { id, init } = declarator;

    assert.equal(init.type, 'ArrowFunctionExpression');
    assert.equal(init.returnType, 'String');
    assert.equal(id.name, 'x');
    assert.equal(id.qualifier, null);
  });

  it('extract void function from implicit ArrowFunctionExpression', () => {
    const node = parse('let x = () => undefined;');

    const [declarator] = node.body[0].declarations;

    const { id, init } = declarator;

    assert.equal(init.type, 'ArrowFunctionExpression');
    assert.equal(init.returnType, 'void');
    assert.equal(id.name, 'x');
    assert.equal(id.qualifier, null);
  });

  it('extract void function from explicit VariableDeclarator', () => {
    const node = parse('let x = fun(() => {});');

    const [declarator] = node.body[0].declarations;
    const { id, init } = declarator;

    assert.equal(init.type, 'ArrowFunctionExpression');
    assert.equal(init.returnType, 'void');
    assert.equal(id.name, 'x');
    assert.equal(id.qualifier, null);
  });

  it('extract typed argument from implicit AssignmentPattern', () => {
    const node = parse('let x = String((y = String) => undefined);');

    const [declarator] = node.body[0].declarations;
    const { init } = declarator;
    const [arg] = init.params;

    assert.equal(arg.type, 'Identifier');
    assert.equal(arg.typeAnnotation, 'String');
    assert.equal(arg.name, 'y');
  });

  it('extract type and init from implicit VariableDeclarator without default value', () => {
    const node = parse('let x = String;');

    const [declarator] = node.body[0].declarations;
    const { id, init } = declarator;

    assert.equal(init, undefined);

    assert.equal(id.type, 'Identifier');
    assert.equal(id.typeAnnotation, 'String');
    assert.equal(id.name, 'x');
    assert.equal(id.qualifier, null);
  });

  it('extract type and init from explicit VariableDeclarator without default value inside fun', () => {
    const node = parse(`let x = String(() => {
      let foo = type(String);
      return foo;
    });`);

    const [declarator] = node.body[0].declarations[0].init.body.body[0].declarations;
    const { id, init } = declarator;

    assert.equal(init, undefined);

    assert.equal(id.type, 'Identifier');
    assert.equal(id.typeAnnotation, 'String');
    assert.equal(id.name, 'foo');
    assert.equal(id.qualifier, null);
  });

  it('extract type and init from implicit VariableDeclarator without default value inside fun', () => {
    const node = parse(`let x = String(() => {
      let foo = String;
      return foo;
    });`);

    const [declarator] = node.body[0].declarations[0].init.body.body[0].declarations;
    const { id, init } = declarator;

    assert.equal(init, undefined);

    assert.equal(id.type, 'Identifier');
    assert.equal(id.typeAnnotation, 'String');
    assert.equal(id.name, 'foo');
    assert.equal(id.qualifier, null);
  });

  it('extract type and init from implicit VariableDeclarator inside fun', () => {
    const node = parse(`let x = String(() => {
      let foo = String('bar');
      return foo;
    });`);

    const [declarator] = node.body[0].declarations[0].init.body.body[0].declarations;
    const { id, init } = declarator;

    assert.equal(init.type, 'CallExpression');
    assert.equal(init.callee.name, 'String');
    assert.equal(init.arguments[0].value, 'bar');

    assert.equal(id.type, 'Identifier');
    assert.equal(id.typeAnnotation, 'String');
    assert.equal(id.name, 'foo');
    assert.equal(id.qualifier, null);
  });

  it('extract array type and init from implicit VariableDeclarator', () => {
    const node = parse(`
      let foo = String(['foo', 'bar']);
    `);

    const [declarator] = node.body[0].declarations;
    const { id, init } = declarator;

    assert.equal(init.type, 'CallExpression');
    assert.equal(init.callee.name, 'String');
    assert.equal(init.arguments[0].elements[0].value, 'foo');
    assert.equal(init.arguments[0].elements[1].value, 'bar');

    assert.equal(id.type, 'Identifier');
    assert.equal(id.typeAnnotation, 'String[2]');
    assert.equal(id.name, 'foo');
    assert.equal(id.qualifier, null);
  });

  it('extract type and init from implicit VariableDeclarator inside fun with multiple args', () => {
    const node = parse(`let x = Vec2(() => {
      let foo = Vec2(3.0, 2.0);
      return foo;
    });`);

    const [declarator] = node.body[0].declarations[0].init.body.body[0].declarations;
    const { id, init: { type, callee, arguments: args } } = declarator;

    assert.equal(type, 'CallExpression');
    assert.equal(callee.name, 'Vec2');

    assert.equal(id.type, 'Identifier');
    assert.equal(id.typeAnnotation, 'Vec2');
    assert.equal(id.name, 'foo');
    assert.equal(id.qualifier, null);

    assert.equal(args[0].value, 3);
    assert.equal(args[1].value, 2);
  });

  it('extract init from implicit VariableDeclarator inside fun without getting the type', () => {
    const node = parse(`let x = Vec2(() => {
      let foo = x.yx;
      return foo;
    });`);

    const [declarator] = node.body[0].declarations[0].init.body.body[0].declarations;
    const { id, init: { type, object, property } } = declarator;

    assert.equal(id.type, 'Identifier');
    assert.equal(id.typeAnnotation, null);
    assert.equal(id.name, 'foo');
    assert.equal(id.qualifier, null);

    assert.equal(type, 'MemberExpression');
    assert.equal(object.name, 'x');
    assert.equal(property.name, 'yx');

  });

  it('extract type and init from implicit VariableDeclarator inside fun with multiple args', () => {
    const node = parse(`let x = String(() => {
      let foo = String(createString());
      return foo;
    });`);

    const [declarator] = node.body[0].declarations[0].init.body.body[0].declarations;

    const { id, init: { type, callee, arguments: args } } = declarator;

    assert.equal(type, 'CallExpression');
    assert.equal(callee.name, 'String');
    assert.equal(args[0].callee.name, 'createString');

    assert.equal(id.type, 'Identifier');
    assert.equal(id.typeAnnotation, 'String');
    assert.equal(id.name, 'foo');
    assert.equal(id.qualifier, null);
  });

  it('extract typed argument and its "right" from implicit AssignmentPattern', () => {
    const node = parse('let x = String((y = String("foo")) => undefined);');

    const [declarator] = node.body[0].declarations;
    const { init } = declarator;
    const [arg] = init.params;
    const { left, right } = arg;

    assert.equal(arg.type, 'AssignmentPattern');
    assert.equal(left.type, 'Identifier');
    assert.equal(left.typeAnnotation, 'String');
    assert.equal(left.name, 'y');
    assert.equal(right.value, 'foo');
  });
});

describe('jstree autodetect primitive tests', () => {

  it('extract type via autodetect float', () => {
    const node = parse('let x = 5.0;', { float: 'SPECIAL' });

    const [declarator] = node.body[0].declarations;
    const { id, init } = declarator;

    assert.equal(id.type, 'Identifier');
    assert.equal(id.typeAnnotation, 'SPECIAL');
    assert.equal(id.name, 'x');
    assert.equal(id.qualifier, null);
    assert.equal(init.raw, '5.0');
  });

  it('extract type via autodetect unary float', () => {
    const node = parse('let x = +5.0;', { float: 'SPECIAL' });

    const [declarator] = node.body[0].declarations;
    const { id, init } = declarator;

    assert.equal(id.type, 'Identifier');
    assert.equal(id.typeAnnotation, 'SPECIAL');
    assert.equal(id.name, 'x');
    assert.equal(id.qualifier, null);
    assert.equal(init.raw, '+5.0');
  });

  it('extract type via autodetect integer', () => {
    const node = parse('let x = 5;', { integer: 'SPECIAL' });

    const [declarator] = node.body[0].declarations;
    const { id, init } = declarator;

    assert.equal(id.type, 'Identifier');
    assert.equal(id.typeAnnotation, 'SPECIAL');
    assert.equal(id.name, 'x');
    assert.equal(id.qualifier, null);
    assert.equal(init.raw, '5');
  });

  it('extract type via autodetect string', () => {
    const node = parse('let x = "5";', { string: 'SPECIAL' });

    const [declarator] = node.body[0].declarations;
    const { id, init } = declarator;

    assert.equal(id.type, 'Identifier');
    assert.equal(id.typeAnnotation, 'SPECIAL');
    assert.equal(id.name, 'x');
    assert.equal(id.qualifier, null);
    assert.equal(init.raw, '"5"');
  });

  it('extract type via autodetect boolean', () => {
    const node = parse('let x = true;', { boolean: 'SPECIAL' });

    const [declarator] = node.body[0].declarations;
    const { id, init } = declarator;

    assert.equal(id.type, 'Identifier');
    assert.equal(id.typeAnnotation, 'SPECIAL');
    assert.equal(id.name, 'x');
    assert.equal(id.qualifier, null);
    assert.equal(init.raw, 'true');
  });

  it('works with class', () => {

    const node = parse(`
      let MyType = cls({
        fNormal: Vec3,
        vNormal: type(Vec4)
      });
    `);

    const [declarator] = node.body[0].declarations;
    const { id, type, body: { body: [fNormal, vNormal] } } = declarator;

    assert.equal(id.type, 'Identifier');
    assert.equal(id.name, 'MyType');
    assert.equal(type, 'ClassDeclaration');

    assert.equal(fNormal.type, 'PropertyDefinition');
    assert.equal(fNormal.typeAnnotation, 'Vec3');
    assert.equal(fNormal.key.name, 'fNormal');

    assert.equal(vNormal.type, 'PropertyDefinition');
    assert.equal(vNormal.typeAnnotation, 'Vec4');
    assert.equal(vNormal.key.name, 'vNormal');
  });

  it('auto detects type for inline variables', () => {
    const node = parse(`let x = Vec2((y = Vec2()) => {
      let foo = y;
      return foo;
    });`);

    const [declarator] = node.body[0].declarations[0].init.body.body[0].declarations;
    const { id, init } = declarator;

    assert.equal(id.type, 'Identifier');
    assert.equal(id.typeAnnotation, 'Vec2');
    assert.equal(id.name, 'foo');
    assert.equal(id.qualifier, null);

    assert.equal(init.type, 'Identifier');
    assert.equal(init.name, 'y');

  });

  it('auto detects return type of other functions for inline variables', () => {
    const node = parse(`
    let bar = float(() => {
      return 5.0;
    });

    let x = Vec2((y = Vec2()) => {
      let foo = bar();
      return vec2(foo);
    });
    `);

    const [declarator] = node.body[1].declarations[0].init.body.body[0].declarations;
    const { id } = declarator;

    assert.equal(id.type, 'Identifier');
    assert.equal(id.typeAnnotation, 'float');
    assert.equal(id.name, 'foo');
    assert.equal(id.qualifier, null);

  });

  it('auto detects type from builtin function', () => {
    const node = parse(`let x = Vec2((y = Vec2()) => {
      let foo = normalize(y);
      return foo;
    });`, { scope: {
      normalize: (arg) => arg
    } });

    const [declarator] = node.body[0].declarations[0].init.body.body[0].declarations;
    const { id, init } = declarator;

    assert.equal(id.type, 'Identifier');
    assert.equal(id.typeAnnotation, 'Vec2');
    assert.equal(id.name, 'foo');
    assert.equal(id.qualifier, null);

    assert.equal(init.type, 'CallExpression');
    assert.equal(init.callee.name, 'normalize');

  });

  it('auto detects type from mathematical calculations', () => {
    const node = parse(`let x = Vec2((y = Vec2(), z = Mat3()) => {
      let foo = z * z;
      let bar = y * foo;
      return foo;
    });`, { scope: {

      mul: (left, right) => {
        if (left === 'Mat3' && right === 'Mat3') {
          return 'Mat3';
        } if (left === 'Vec2' && right === 'Mat3') {
          return 'Vec2';
        }
      }
    } });

    const [decl1] = node.body[0].declarations[0].init.body.body[0].declarations;
    const [decl2] = node.body[0].declarations[0].init.body.body[1].declarations;

    const { id: id1 } = decl1;
    const { id: id2 } = decl2;

    assert.equal(id1.type, 'Identifier');
    assert.equal(id1.typeAnnotation, 'Mat3');
    assert.equal(id1.name, 'foo');
    assert.equal(id1.qualifier, null);

    assert.equal(id2.type, 'Identifier');
    assert.equal(id2.typeAnnotation, 'Vec2');
    assert.equal(id2.name, 'bar');
    assert.equal(id2.qualifier, null);

  });

  it('explicit type priority over auto detects type', () => {
    const node = parse(`let x = Vec2((y = Vec2()) => {
      let foo = Vec3(normalize(y));
      return foo;
    });`, { scope: {
      normalize: (arg) => arg
    } });

    const [declarator] = node.body[0].declarations[0].init.body.body[0].declarations;
    const { id, init } = declarator;

    assert.equal(id.type, 'Identifier');
    assert.equal(id.typeAnnotation, 'Vec3');
    assert.equal(id.name, 'foo');
    assert.equal(id.qualifier, null);

    assert.equal(init.type, 'CallExpression');
    assert.equal(init.callee.name, 'Vec3');
  });
});
