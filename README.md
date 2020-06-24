[![GitHub package version](https://img.shields.io/github/package-json/v/basics/jsto....svg)](https://github.com/basics/jsto...)
[![license](https://img.shields.io/github/license/basics/jsto....svg)](https://github.com/basics/jsto...)

[![OSX/Linux Build Status](https://travis-ci.org/basics/jsto....svg?branch=master)](https://travis-ci.org/basics/jsto...)
[![Dependencies Status](https://david-dm.org/basics/jsto.../status.svg)](https://david-dm.org/basics/jsto...)
[![DevDependencies Status](https://david-dm.org/basics/jsto.../dev-status.svg)](https://david-dm.org/basics/jsto...?type=dev)

# jsto...

this libary is going to provide you a simple way of writing typed javascript code.
this code can run and tested directly with javascript.
but with types it can be transpiled to other languages, too.

a type checker is in process, too. there will be a simple checking without type inference, 
this can be archived with typescript, but not at runtime.

| environment              | jsto... checker | typescript |
| ------------------------ | :-------------: | :--------: |
| run time                 |        ✓        |     ✗      |
| build time               |        ✓        |     ✓      |
| IDE time (the best time) |        ✗        |     ✓      |

| typesafe   | jsto... checker | typescript |
| ---------- | :-------------: | :--------: |
| functions  |        ✓        |     ✓      |
| arguments  |        ✓        |     ✓      |
| classes    |        ✓        |     ✓      |
| attributes |        ✓        |     ✓      |
| methods    |        ✓        |     ✓      |
| variables  |        ✗        |     ✓      |

# features in process

- [x] generate JSTree out of javascript
  - ESTree + type annotations
- [ ] index.d.ts file with generics for typescript
- [ ] jstoGLSL transpiler
  - [x] generate valid glsl code
  - [ ] glsl polyfills
    - [x] modulo as arithmetic operator
    - [ ] destruct
    - [ ] functional structs
    - [ ] inline functions for map, reduce, filter
- [ ] jstoGLSL simulator
  - [ ] there are some js-glsl simulator out there, have to evaluate them
  - [ ] quaternion rotate as function with chaining
  - [x] vector arithmetic support

in future

- [ ] jstoWASM transpiler 
  inspired by https://github.com/AssemblyScript/assemblyscript
  use decompiler to compare https://v8.dev/blog/wasm-decompile
- [ ] jstoWASM simulator
- [ ] what other languages do we need?

# JSTree extended from ESTree

`typeAnnotation` for Literals and Identifiers

`returnType` for Functions
