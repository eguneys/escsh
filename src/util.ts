export type FUse<A> = (_: A) => void

export class Sub<A> {
  private fn: () => A
  private subs: FUse<A>[]

  constructor(fn: () => A) {
    this.subs = [];
    this.fn = fn;
  }

  sub(fn: FUse<A>) {
    this.subs.push(fn);
  }

  trigger() {
    let val = this.fn();
    this.subs.forEach(_ => _(val));
  }
}


export class Sub2<A> {
  private subs: FUse<A>[]

  constructor() {
    this.subs = [];
  }

  sub(fn: FUse<A>) {
    this.subs.push(fn);
  }

  pub(val: A) {
    this.subs.forEach(_ => _(val));
  }
}
