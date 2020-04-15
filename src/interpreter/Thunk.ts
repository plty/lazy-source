import {Value} from "../types";

class Thunk{
  private cache?: Value
  constructor(readonly supplier: () => IterableIterator<Value>) {}

  static from(v: any): Thunk {
    return new Thunk(() => v)
  }

  *value(): Generator<any, Value, any> {
    if (this.cache === undefined) {
      this.cache = yield* this.supplier()
    }
    return this.cache
  }

  get retval() {
    if (this.cache !== undefined) {
      return this.cache
    }

    const g = this.value()
    let v = g.next()
    while(!v.done) {
      v = g.next()
    }
    this.cache = v.value
    return v.value
  }
}

export default Thunk