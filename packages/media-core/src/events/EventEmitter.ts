export type EventMap = Record<string, unknown>;
export type Listener<Payload> = (payload: Payload) => void;
export type Unsubscribe = () => void;

/**
 * Minimal typed event emitter. Each `on()` call returns its own
 * unsubscribe function so independent consumers never step on each other.
 */
export class EventEmitter<Events extends EventMap> {
  private readonly listeners = new Map<keyof Events, Set<Listener<any>>>();

  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): Unsubscribe {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener);
    return () => this.off(event, listener);
  }

  off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    this.listeners.get(event)?.delete(listener);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const listener of [...set]) {
      listener(payload);
    }
  }

  removeAllListeners(event?: keyof Events): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}
