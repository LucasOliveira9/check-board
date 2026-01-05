import { IEventListener, TEventListenerEvents } from "types";

export interface IEventEmitter extends IEventListener {
  emit(event: TEventListenerEvents, ...args: any[]): void;
}
