export class AsyncRequestQueue {
  queue: Array<() => Promise<void>>;
  runningTask: number;
  maxConcurrentTasks: number;
  constructor() {
    this.queue = [];
    this.runningTask = 0;
    this.maxConcurrentTasks = 3;
  }

  enqueue<T>(promiseFactory: () => Promise<T>) {
    const task = async () => {
      this.runningTask++;
      try {
        await promiseFactory();
      } finally {
        this.runningTask--;
        this.tryToExecute();
      }
    };

    if (this.runningTask < this.maxConcurrentTasks) {
      task();
    } else {
      this.queue.push(task);
    }
  }

  tryToExecute() {
    console.log("Items in queue:::", this.queue.length);
    if (
      this.queue.length === 0 ||
      this.runningTask >= this.maxConcurrentTasks
    ) {
      return;
    }

    const nextTask = this.queue.shift();
    nextTask();
  }
}
