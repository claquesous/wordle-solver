export class Deque {
  #head = 0;
  #tail = 0;
  #data = {};

  constructor(items = []) {
    for (const item of items) {
      this.#data[this.#tail++] = item;
    }
  }

  get length() { return this.#tail - this.#head; }

  push(...items) {
    for (const item of items) {
      this.#data[this.#tail++] = item;
    }
  }

  pop() {
    if (this.length === 0) return undefined;
    const item = this.#data[--this.#tail];
    delete this.#data[this.#tail];
    return item;
  }

  shift() {
    if (this.length === 0) return undefined;
    const item = this.#data[this.#head];
    delete this.#data[this.#head++];
    return item;
  }

  unshift(...items) {
    for (let i = items.length - 1; i >= 0; i--) {
      this.#data[--this.#head] = items[i];
    }
  }

  toString() {
    const parts = [];
    for (let i = this.#head; i < this.#tail; i++) {
      parts.push(this.#data[i]);
    }
    return parts.join(",");
  }
}
