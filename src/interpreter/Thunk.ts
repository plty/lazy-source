import {Value} from "../types";

class Thunk{
  private cache?: Value
  constructor(readonly supplier: () => Generator<any, Value, any>) {}

  *value(): Generator<any, Value, any> {
    if (this.cache === undefined) {
      this.cache = yield* this.supplier()
    }
    return this.cache
  }
}

export default Thunk