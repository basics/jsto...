export const string = '';
export const number = 0;
export const boolean = false;

export class ExpectedReturnType<Right> {

}

type TypedClass<T> = { new(...args: any[]): T };

type GetBoolean<T> = { valueOf(): T & boolean };

type GetNumber<T> = { valueOf(): T, toExponential(): string };

type GetString<T> = { valueOf(): T, toLocaleLowerCase(): string };

type TypeOf<T> = TypedClass<T> | GetNumber<T> | GetString<T> | GetBoolean<T> | T;

declare function typ<T>(type: TypeOf<T>): T;

type Fun<R> = (...args: any) => R;

declare function fun<F>(func: F): F extends Fun<void> ? (...args: (Required<Parameters<F>> & Array<any>)) => void : ExpectedReturnType<void>;
declare function fun<F, T>(type: TypeOf<T>, func: F): F extends Fun<T> ? (...args: (Required<Parameters<F>> & Array<any>)) => T : ExpectedReturnType<T>;

declare function cls<T>(clazz: T): T extends abstract new (...args: any) => any ? new (...args: (Required<ConstructorParameters<T>> & Array<any>)) => InstanceType<T> : never;
