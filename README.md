[![GitHub package version](https://img.shields.io/github/package-json/v/basics/jsto....svg)](https://github.com/basics/jsto...)
[![npm version](https://img.shields.io/npm/v/@js-basics/jsto....svg)](https://www.npmjs.com/package/@js-basics/jsto...)
[![license](https://img.shields.io/github/license/basics/jsto....svg)](https://github.com/basics/jsto...)

[![OSX/Linux Build Status](https://travis-ci.org/basics/jsto....svg?branch=master)](https://travis-ci.org/basics/jsto...)
[![Dependencies Status](https://david-dm.org/basics/jsto.../status.svg)](https://david-dm.org/basics/jsto...)
[![DevDependencies Status](https://david-dm.org/basics/jsto.../dev-status.svg)](https://david-dm.org/basics/jsto...?type=dev)

# jsto ...

this libary is going to provide you a simple way of writing typed js code.
this code can run and tested directly with js.
but with types it can be transpiled to other languages, too.

type inference is supported by type checker.

| environment              | jsto... checker | typescript |
| ------------------------ | :-------------: | :--------: |
| run time                 |        ✓        |     ✗      |
| build time               |        ✓        |     ✓      |
| IDE time (the best time) |        ✗        |     ✓      |

| typesafe    | jsto... checker | typescript |
| ----------- | :-------------: | :--------: |
| functions   |        ✓        |     ✓      |
| arguments   |        ✓        |     ✓      |
| classes     |        ✓        |     ✓      |
| methods     |        ✓        |     ✓      |
| variables   |        ✗        |     ✓      |
| arithmetics |        ✓        |     ✗      |

# features in process

- [x] generate JSTree out of js
  - ESTree + type annotations
- [x] type inference
- [ ] jstoGLSL transpiler great for performance
  - [x] generate valid glsl code
  - [ ] js transformations to glsl
    - [x] modulo as arithmetic operator
    - [x] pow as arithmetic operator
    - [ ] variable index expression for vectors
    - [ ] gentype for function outline
    - [ ] functional structs
    - [ ] destruct
    - [ ] symbols and enums
    
- [x] jstoGLSL simulator great for testing
  - [x] painting (slowly) to image buffer
  - [x] vector arithmetic (component wise) operator support
  - [x] partly matrix algebraic operator support
  - [ ] typesafety

in future

- [ ] jstoWorker
  - [ ] transpile js code without overhead of types and arithmetics

# JSTree extended from ESTree

`typeAnnotation` for Literals and Identifiers

`returnType` for Functions

# Demos

[first glsl simulation in js](https://unpkg.com/@js-basics/jsto.../demo/index.html)
