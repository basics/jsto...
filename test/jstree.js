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

    assert.equal(init.type, 'Literal');
    assert.equal(init.value, 'foo');

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

    assert.equal(init.type, 'Literal');
    assert.equal(init.value, 'foo');

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
});
