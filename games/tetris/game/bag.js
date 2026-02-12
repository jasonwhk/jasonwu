const TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

function shuffle(items) {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export class Bag {
  constructor() {
    this.queue = [];
  }

  refill() {
    this.queue.push(...shuffle(TYPES));
  }

  next() {
    if (this.queue.length === 0) this.refill();
    return this.queue.shift();
  }

  peek(count = 3) {
    while (this.queue.length < count) this.refill();
    return this.queue.slice(0, count);
  }
}
