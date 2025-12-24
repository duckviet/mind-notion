export default class EventEmitter {
  private events: { [eventName: string]: Function[] };
  private onceWrappers = new WeakMap<Function, Function>();

  constructor() {
    this.events = {};
  }

  /** Register an event listener */
  on(eventName: string, listener: Function): void {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(listener);
  }

  /** Register a one-time event listener */

  once(eventName: string, listener: Function): void {
    const wrapper = (...args: unknown[]) => {
      try {
        listener(...args);
      } finally {
        this.off(eventName, wrapper);
        this.onceWrappers.delete(listener);
      }
    };
    this.onceWrappers.set(listener, wrapper);
    this.on(eventName, wrapper);
  }

  /** Emit an event */
  emit(eventName: string, ...args: unknown[]): void {
    if (this.events[eventName]) {
      this.events[eventName].forEach((listener) => {
        listener(...args);
      });
    }
  }

  /** Remove a specific event listener */
  off(eventName: string, listener: Function): void {
    // Check if this is a once listener and remove its wrapper
    const wrapper = this.onceWrappers.get(listener);
    if (wrapper) {
      this.off(eventName, wrapper);
      this.onceWrappers.delete(listener);
      return;
    }

    if (!this.events[eventName]) return;
    this.events[eventName] = this.events[eventName].filter(
      (l) => l !== listener
    );
    if (this.events[eventName].length === 0) {
      delete this.events[eventName];
    }
  }

  /** Clear all listeners for a specific event */
  clear(eventName: string): void {
    if (this.events[eventName]) {
      delete this.events[eventName];
    }
  }

  clearAll(): void {
    this.events = {};
  }
}
