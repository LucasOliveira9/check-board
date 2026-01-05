import { TEventListenerEvents, TListener } from "types";
import { IEventEmitter } from "./interface";

class EventEmitter implements IEventEmitter {
  private events = new Map<TEventListenerEvents, TListener[]>();

  on(event: TEventListenerEvents, listener: TListener): () => void {
    const listeners = this.events.get(event) ?? [];
    if (listeners.includes(listener)) return () => {};

    listeners.push(listener);
    this.events.set(event, listeners);

    return () => this.off(event, listener);
  }

  off(event: TEventListenerEvents, listener: TListener): void {
    const listeners = this.events.get(event);
    if (!listeners) return;

    const index = listeners.indexOf(listener);
    if (index === -1) return;

    listeners.splice(index, 1);
    if (!listeners.length) this.events.delete(event);
  }

  emit(event: TEventListenerEvents, ...args: any[]): void {
    const listeners = this.events.get(event);
    if (!listeners) return;

    for (const listener of [...listeners]) {
      listener(...args);
    }
  }

  once(event: TEventListenerEvents, listener: TListener): () => void {
    const wrapper: TListener = (...args) => {
      off();
      listener(...args);
    };

    const off = this.on(event, wrapper);
    return off;
  }
}

export default EventEmitter;
