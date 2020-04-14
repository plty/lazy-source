//let uid = 0
class Evaluable<T> {
  //private readonly uid: number
  private cache?: T
  supplier: () => T

  constructor(supplier: () => T) {
    this.supplier = supplier
    //this.uid = uid++
  }

  static from<T>(v: T): Evaluable<T> {
    return new Evaluable(() => v)
  }

  get value() {
    if (this.cache === undefined) {
      // tslint:disable-next-line:no-console
      this.cache = this.cache ?? this.supplier()
      // console.log('Evaluated:', this.uid, this.cache)
    }

    return this.cache
  }

  map<U>(transformer: (v: T) => U): Evaluable<U> {
    return new Evaluable(() => transformer(this.value))
  }
}

export default Evaluable
