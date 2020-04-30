import { Value } from '../types'

class Thunk {
  constructor(private supplier: () => IterableIterator<Value>) {}

  static from(v: any): Thunk {
    return new Thunk(function*() {
      return v
    })
  }

  private static valueOf<T>(generator: IterableIterator<T>): T {
    let v = generator.next()
    while (!v.done) v = generator.next()
    return v.value
  }

  *evaluate(): IterableIterator<Value> {
    const v = yield* this.supplier()
    this.supplier = function*() {
      return v
    }
    return v
  }

  get value() {
    return Thunk.valueOf(this.evaluate())
  }
}

export default Thunk
