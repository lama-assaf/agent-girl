/**
 * AsyncQueue - Promise-based async queue for message handling
 * Based on Signal Desktop's AsyncQueue implementation
 */

export class AsyncQueue<T> implements AsyncIterable<T> {
  private queue: T[] = [];
  private resolvers: Array<(value: IteratorResult<T>) => void> = [];
  private isComplete = false;

  /**
   * Add item to queue. If consumers are waiting, resolve immediately.
   */
  enqueue(item: T): void {
    if (this.isComplete) {
      console.error('🔴 [AsyncQueue] Attempted to enqueue to completed queue');
      throw new Error('Cannot enqueue to completed queue');
    }

    const resolver = this.resolvers.shift();
    if (resolver) {
      // Consumer waiting, resolve immediately
      console.log(`🔵 [AsyncQueue] Enqueue: Consumer waiting, resolving immediately (resolvers: ${this.resolvers.length}, queue: ${this.queue.length})`);
      resolver({ value: item, done: false });
    } else {
      // No consumer waiting, add to queue
      this.queue.push(item);
      console.log(`🔵 [AsyncQueue] Enqueue: Added to queue (resolvers: ${this.resolvers.length}, queue: ${this.queue.length})`);
    }
  }

  /**
   * Mark queue as complete. Future iterations will end.
   */
  complete(): void {
    console.log(`🔵 [AsyncQueue] Complete called (resolvers: ${this.resolvers.length}, queue: ${this.queue.length})`);
    this.isComplete = true;
    // Resolve all waiting consumers with done=true
    for (const resolver of this.resolvers) {
      console.log(`🔵 [AsyncQueue] Resolving waiting consumer with done=true`);
      resolver({ value: undefined as T, done: true });
    }
    this.resolvers = [];
  }

  /**
   * AsyncIterable implementation - allows for-await-of usage
   */
  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    console.log(`🔵 [AsyncQueue] Iterator started`);
    let iterationCount = 0;

    while (true) {
      iterationCount++;

      // If items in queue, yield immediately
      if (this.queue.length > 0) {
        const item = this.queue.shift()!;
        console.log(`🔵 [AsyncQueue] Iteration ${iterationCount}: Yielding from queue (remaining: ${this.queue.length})`);
        yield item;
        continue;
      }

      // If complete and queue empty, end iteration
      if (this.isComplete) {
        console.log(`🔵 [AsyncQueue] Iteration ${iterationCount}: Queue complete, ending iteration`);
        return;
      }

      // Wait for next item
      console.log(`🔵 [AsyncQueue] Iteration ${iterationCount}: Waiting for next item (resolvers: ${this.resolvers.length + 1})`);
      const result = await new Promise<IteratorResult<T>>((resolve) => {
        this.resolvers.push(resolve);
      });

      if (result.done) {
        console.log(`🔵 [AsyncQueue] Iteration ${iterationCount}: Received done signal, ending iteration`);
        return;
      }

      console.log(`🔵 [AsyncQueue] Iteration ${iterationCount}: Received value, yielding`);
      yield result.value;
    }
  }

  /**
   * Get current queue size
   */
  get size(): number {
    return this.queue.length;
  }

  /**
   * Check if queue has waiting consumers
   */
  get hasWaitingConsumers(): boolean {
    return this.resolvers.length > 0;
  }
}
