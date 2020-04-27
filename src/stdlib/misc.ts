import { Context, Value } from '../types'
import { stringify } from '../utils/stringify'
import Thunk from '../interpreter/Thunk'

/**
 * A function that displays to console.log by default (for a REPL).
 *
 * @param value the value to be represented and displayed.
 * @param externalContext a property of Context that can hold
 *   any information required for external use (optional).
 */
export function rawDisplay(value: Value, str: string, externalContext: any) {
  // tslint:disable-next-line:no-console
  console.log((str === undefined ? '' : str + ' ') + value.toString())
  return value
}

export function error_message(value: Value, str?: string) {
  const output = (str === undefined ? '' : str + ' ') + stringify(value)
  throw new Error(output)
}

export function timed(
  context: Context,
  // tslint:disable-next-line:ban-types
  f: Function,
  externalContext: any,
  displayBuiltin: (value: Value, str: string, externalContext: any) => Value
) {
  return (...args: any[]) => {
    const start = runtime()
    const result = f(...args)
    const diff = runtime() - start
    displayBuiltin('Duration: ' + Math.round(diff) + 'ms', '', externalContext)
    return result
  }
}

export function is_number(v: Thunk) {
  return typeof v.value === 'number'
}

export function is_undefined(xs: Thunk) {
  return typeof xs.value === 'undefined'
}

export function is_string(xs: Thunk) {
  return typeof xs.value === 'string'
}

export function is_boolean(xs: Thunk) {
  return typeof xs.value === 'boolean'
}

export function is_object(xs: Thunk) {
  return typeof xs.value === 'object' || is_function(xs.value)
}

export function is_function(xs: Thunk) {
  return typeof xs.value === 'function'
}

export function is_NaN(x: Thunk) {
  return is_number(x.value) && isNaN(x.value)
}

export function has_own_property(obj: Thunk, p: Thunk) {
  return obj.value.hasOwnProperty(p.value)
}

export function is_array(a: Thunk) {
  return a.value instanceof Array
}

export function array_length(xs: Thunk) {
  return xs.value.length
}

/**
 * Source version of parseInt. Both arguments are required.
 *
 * @param str String representation of the integer to be parsed. Required.
 * @param radix Base to parse the given `str`. Required.
 *
 * An error is thrown if `str` is not of type string, or `radix` is not an
 * integer within the range 2, 36 inclusive.
 */
export function parse_int(str: string, radix: number) {
  if (
    typeof str === 'string' &&
    typeof radix === 'number' &&
    Number.isInteger(radix) &&
    2 <= radix &&
    radix <= 36
  ) {
    return parseInt(str, radix)
  } else {
    throw new Error(
      'parse_int expects two arguments a string s, and a positive integer i between 2 and 36, inclusive.'
    )
  }
}

export function runtime() {
  return new Date().getTime()
}
