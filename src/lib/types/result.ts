/**
 * This module contains the Result type, which is loosely based on the
 * Result type from Rust.
 * https://doc.rust-lang.org/std/result/enum.Result.html
 */

type ResultType = 'ok' | 'err'
type ResultErr = NonNullable<unknown>

/**
 * A TypeScript port of the Result type from Rust.
 */
export class Result<T, E extends ResultErr = Error> {
  private constructor(
    private readonly _type: ResultType,
    private readonly _value: T,
    private readonly _error?: E
  ) {}

  /**
   * Create a new Result with a value.
   * @param value
   * @returns Result
   */
  static fromOk<T, E extends ResultErr = Error>(value: T): Result<T, E> {
    return new Result('ok', value)
  }

  /**
   * Create a new Result with an error.
   * @param error
   * @returns Result
   */
  static fromErr<T, E extends ResultErr = Error>(error: E): Result<T, E> {
    return new Result('err', undefined as T, error)
  }

  /**
   * Check if the Result is an Ok.
   */
  isOk(): this is { type: 'ok'; value: T; error: never } {
    return this._type === 'ok'
  }

  /**
   * Check if the Result is an Err.
   */
  isErr(): this is { type: 'err'; error: E; value: never } {
    return this._type === 'err'
  }

  /**
   * Throw a custom message if the Result is an Err, or return the value if it is an Ok.
   * @param message
   * @returns T
   * @throws Error
   */
  expect(message: string): T {
    if (this._error) {
      throw new Error(message)
    }

    return this._value
  }

  /**
   * Throw an error if the Result is an Err, or return the value if it is an Ok.
   * @returns T
   * @throws E
   */
  unwrap(): T {
    if (this._type === 'err') {
      throw this._error
    }

    return this._value
  }

  /**
   * Retrieve the contained value.
   */
  ok(): this extends { type: 'ok'; value: T } ? T : never {
    return this._value as this extends { type: 'ok'; value: T } ? T : never
  }

  /**
   * Retrieve the contained error.
   */
  err(): this extends { type: 'err'; error: E } ? E : never {
    return this._error as this extends { type: 'err'; error: E } ? E : never
  }

  /**
   * Returns the value if the Result is an Ok, or a default value if it is an Err.
   * @param defaultValue
   * @returns T
   */
  unwrapOr(defaultValue: T): T {
    if (this._error) {
      return defaultValue
    }

    return this._value
  }

  /**
   * Returns a new error result with the given type for T if the Result is an Err, or
   * throws if it is an Ok.
   * @returns Result
   * @throws Error
   */
  errInto<NewT>(): Result<NewT, E> {
    if (!this._error) {
      throw new Error('called `Result.errInto()` on an Ok value')
    }
    return Result.fromErr<NewT, E>(this._error)
  }
}

/**
 * Create a new Ok Result.
 */
export function Ok<T, E extends ResultErr = Error>(value: T): Result<T, E> {
  return Result.fromOk<T, E>(value)
}

/**
 * Create a new Err Result.
 */
export function Err<T, E extends ResultErr = Error>(error: E): Result<T, E> {
  return Result.fromErr<T, E>(error)
}