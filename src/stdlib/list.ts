import { stringify } from '../utils/stringify'
import Thunk from '../interpreter/Thunk'
import { Value } from '../types'

// list.ts: Supporting lists in the Scheme style, using pairs made
//          up of two-element JavaScript array (vector)
// Author: Martin Henz
// Translated to TypeScript by Evan Sebastian
export type Pair = [Thunk, Thunk]
export type List = null | NonEmptyList
interface NonEmptyList extends Pair {}

// array test works differently for Rhino and
// the Firefox environment (especially Web Console)
function array_test(x: any) {
  if (Array.isArray === undefined) {
    return x instanceof Array
  } else {
    return Array.isArray(x)
  }
}

// pair constructs a pair using a two-element array
// LOW-LEVEL FUNCTION, NOT SOURCE
export function* pair(x: Thunk, xs: Thunk) {
  return [x, xs]
}

// is_pair returns true iff arg is a two-element array
// LOW-LEVEL FUNCTION, NOT SOURCE
export function* is_pair(x: Thunk) {
  const value = yield* x.evaluate()
  return array_test(value) && value.length === 2
}

// head returns the first component of the given pair,
// throws an exception if the argument is not a pair
// LOW-LEVEL FUNCTION, NOT SOURCE
export function* head(xs: Thunk) {
  if (yield* is_pair(xs)) {
    const p = yield* xs.evaluate()
    return yield* p[0].evaluate()
  } else {
    throw new Error('head(xs) expects a pair as argument xs, but encountered ' + stringify(xs))
  }
}

// tail returns the second component of the given pair
// throws an exception if the argument is not a pair
// LOW-LEVEL FUNCTION, NOT SOURCE
export function* tail(xs: Thunk) {
  if (yield* is_pair(xs)) {
    const p = yield* xs.evaluate()
    return yield* p[1].evaluate()
  } else {
    throw new Error('tail(xs) expects a pair as argument xs, but encountered ' + stringify(xs))
  }
}

// is_null returns true if arg is exactly null
// LOW-LEVEL FUNCTION, NOT SOURCE
export function* is_null(xs: Thunk) {
  const value = yield* xs.evaluate()
  return value === null
}

// list makes a list out of its arguments
// LOW-LEVEL FUNCTION, NOT SOURCE
// TODO[@plty]: make this represents computation more.
export function* list(...elements: Thunk[]): IterableIterator<Value> {
  if (elements.length === 0) return null
  const rest = yield* list(...elements.slice(1))
  return pair(elements[0], rest)
}

// list_to_vector returns vector that contains the elements of the argument list
// in the given order.
// list_to_vector throws an exception if the argument is not a list
// LOW-LEVEL FUNCTION, NOT SOURCE
export function* list_to_vector(lst: Thunk): IterableIterator<Value> {
  const p = yield* lst.evaluate()
  if (p === null) return []
  return [yield* p[0]].concat(list_to_vector(p[1]))
}

// vector_to_list returns a list that contains the elements of the argument vector
// in the given order.
// vector_to_list throws an exception if the argument is not a vector
// LOW-LEVEL FUNCTION, NOT SOURCE
export function* vector_to_list(vector: any[]): IterableIterator<Value> {
  return yield* list(...vector)
}

// set_head(xs,x) changes the head of given pair xs to be x,
// throws an exception if the argument is not a pair
// LOW-LEVEL FUNCTION, NOT SOURCE

export function set_head(xs: any, x: any) {
  if (is_pair(xs)) {
    xs[0] = x
    return undefined
  } else {
    throw new Error(
      'set_head(xs,x) expects a pair as argument xs, but encountered ' + stringify(xs)
    )
  }
}

// set_tail(xs,x) changes the tail of given pair xs to be x,
// throws an exception if the argument is not a pair
// LOW-LEVEL FUNCTION, NOT SOURCE

export function set_tail(xs: any, x: any) {
  if (is_pair(xs)) {
    xs[1] = x
    return undefined
  } else {
    throw new Error(
      'set_tail(xs,x) expects a pair as argument xs, but encountered ' + stringify(xs)
    )
  }
}
