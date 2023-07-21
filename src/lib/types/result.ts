/**
 * A TypeScript port of the Result type from Rust.
 */
export class Result<T, E = Error> {
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
    static err<T, E = Error>(error: E) {
        return new Result(undefined as T, error)
    }

    /**
     * Check if the Result is an Ok.
     */
    isOk() {
        return !this.error
    }

    /**
     * Check if the Result is an Err.
     */
    isErr() {
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
     * Returns a new error result with the given type for T if the Result is an Err, or throws if it is an Ok.
     * @returns Result
     * @throws Error
     */
    errInto<NewT>(): Result<NewT, E> {
        if (!this.error) {
            throw new Error('called `Result.intoErr()` on an Ok value')
        }
        return Result.err<NewT, E>(this.error)
    }
}
