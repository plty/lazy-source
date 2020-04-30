import { Context, Value } from '../types'
import Thunk from '../interpreter/Thunk'
import { parse as eagerParse } from './parser'

export function* parse(x: Thunk, context: Context): Value {
  const program = yield* x.evaluate()
  return eagerParse(program, context)
}
