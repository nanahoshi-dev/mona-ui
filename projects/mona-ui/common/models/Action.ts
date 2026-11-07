/** A function taking a `P` and returning an `R`. */
export type Action<P = void, R = void> = (arg: P) => R;
