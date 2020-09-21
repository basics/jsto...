
export declare const string: string;
export declare const number: number;
export declare const boolean: boolean;

type Parameters<T extends ((...args: any) => any) | Function> = T extends (...args: infer P) => any ? P : never;
type ReturnType<T extends ((...args: any) => any) | Function> = T extends (...args: any) => infer R ? R : any;

type TypedClass<T> = { new(...args: any[]): T };

type GetNumber<T> = { valueOf(): T, toExponential(): string };

type GetString<T> = { valueOf(): T, toLocaleLowerCase(): string };

type GetClass<T> = { new(): T };

type GetConstructor<T> = { constructor: T };

type IsType<T> = TypedClass<T> | GetNumber<T> | GetString<T> | T;

// https://dev.to/aexol/typescript-tutorial-infer-keyword-2cn
// type GetType<F extends IsType<any>> = F extends IsType<infer P> ? P : never;

// https://stackoverflow.com/questions/44461636/fixed-length-array-with-optional-items-in-typescript-interface
// type NonNullableArray<T> = {
//   [K in keyof T]: NonNullable<T[K]>
// };

// type IsFun = { isFun: true };
// type TypedDef<T> = Extract<T, IsFun>;

type SameType<A, B, C> = A extends B ? C : never;

type Proto = { constructor: Function };
type TypedCls<T, Con extends Function> = { new(...args: Parameters<Con>): T };

export declare function typ<T>(type: (IsType<T>)): T;

// type Bind = CallableFunction['bind'];

export declare function fun<F extends Function>(func: SameType<ReturnType<F>, void, F>): { (...args: Parameters<F>): ReturnType<F> };
export declare function fun<T, F extends Function>(type: IsType<T>, func: SameType<ReturnType<F>, T, F>): { (...args: Parameters<F>): ReturnType<F> };

export declare function cls<T extends Proto>(prototype: T): TypedCls<Omit<T, 'constructor'>, T['constructor']>;
