class Timer {
  #start = 0;

  constructor() {
    this.start();
  }

  start() {
    this.#start = process.hrtime();
  }

  end() {
    return (process.hrtime(this.#start)[1] / 1e6).toFixed(3);
  }
}

module.exports = Timer;
