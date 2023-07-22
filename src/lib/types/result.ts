/**
 * A TypeScript port of the Result type from Rust.
 */
export class Result<T, E extends NonNullable<unknown> = Error> {
    private constructor(private readonly value: T, private readonly error?: E) {}

    /**
     * Create a new Result with a value.
     * @param value
     * @returns Result
     */
    static ok<T>(value: T): Result<T> {
        return new Result(value)
    }

    /**
     * Create a new Result with an error.
     * @param error
     * @returns Result
     */
    static err<T, E extends NonNullable<unknown> = Error>(error: E): Result<T, E> {
        return new Result(undefined as T, error)
    }

    /**
     * Check if the Result is an Ok.
     */
    isOk(): boolean {
        return !this.error
    }

    /**
     * Check if the Result is an Err.
     */
    isErr(): boolean {
        return !!this.error
    }

    /**
     * Throw a custom message if the Result is an Err, or return the value if it is an Ok.
     * @param message
     * @returns T
     * @throws Error
     */
    expect(message: string): T {
        if (this.error) {
            throw new Error(message)
        }

        return this.value
    }

    /**
     * Throw an error if the Result is an Err, or return the value if it is an Ok.
     * @returns T
     * @throws E
     */
    unwrap(): T {
        if (this.error) {
            throw this.error
        }

        return this.value
    }

    /**
     * Returns the value if the Result is an Ok, or a default value if it is an Err.
     * @param defaultValue
     * @returns T
     */
    unwrapOr(defaultValue: T): T {
        if (this.error) {
            return defaultValue
        }

        return this.value
    }

    /**
     * Converts the current Result to a new Result with the given new types.
     * NOT recommended for use if you can avoid it, as the T type is not checked.
     * @returns Result<NewT, NewE>
     */
    into<NewT, NewE extends NonNullable<unknown> = Error>(): Result<NewT, NewE> {
        return new Result(this.value as unknown as NewT, this.error as NewE | undefined)
    }

    /**
     * Returns a new error result with the given type for T if the Result is an Err, or
     * throws if it is an Ok.
     * @returns Result
     * @throws Error
     */
    errInto<NewT>(): Result<NewT, E> {
        if (!this.error) {
            throw new Error('called `Result.errInto()` on an Ok value')
        }
        return Result.err<NewT, E>(this.error)
    }
}
