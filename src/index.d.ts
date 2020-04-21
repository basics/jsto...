
type TypedClass<T> = { new(...args: any[]): T };

type GetNumber<T> = { valueOf(): T, toExponential(): string };

type GetString<T> = { valueOf(): T, toLocaleLowerCase(): string };

type GetClass<T> = { new(): T };

type GetConstructor<T> = { constructor: T };

type IsType<T> = TypedClass<T> | GetNumber<T> | GetString<T> | GetClass<T> | T;

// https://dev.to/aexol/typescript-tutorial-infer-keyword-2cn
type GetType<F extends IsType<any>> = F extends IsType<infer P> ? P : never;

export declare function typ<T>(c: IsType<T> ): T;

// https://stackoverflow.com/questions/44461636/fixed-length-array-with-optional-items-in-typescript-interface
type NonNullableArray<T> = {
    [K in keyof T]: NonNullable<T[K]>
};

type RequiredArray<T> = NonNullableArray<Required<T>>;

type NonNullableArgsFunction<F, R> = {(...args: RequiredArray<Parameters<F>>): R};

type MyFun = typeof Function;

type SameType<A, B, C> = A extends B ? C : never;

export declare function fun<T extends void, F extends Function>(fun: F): NonNullableArgsFunction<F, T>;
export declare function fun<F extends Function, T extends ReturnType<F>>(type: GetClass<T>, fun: F): NonNullableArgsFunction<F, T>;
// export declare function fun<T, F extends SameType<ReturnType<F>, GetClass<T>, Function>>(type: GetClass<T>, fun: F): NonNullableArgsFunction<F, T>;

export declare function cls<T, A>(prototype: T): TypedClass<Omit<T, 'constructor'>>;
