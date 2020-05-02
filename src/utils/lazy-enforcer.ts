import Thunk from '../interpreter/Thunk'
import { Value } from '../types'

export const unravel = (value: Thunk): Value => {
  // Used to check if there are any cyclic structures
  const unravelThunk = (v: Value | Thunk): Value => {
    if (v instanceof Thunk) {
      return v.value()
    } else if (Array.isArray(v)) {
      return v.map(x => unravelThunk(x))
    } else {
      return v
    }
  }

  return unravelThunk(value)
}