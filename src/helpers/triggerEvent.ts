import { TBoardEventContext, TBoardEvents } from "src/types/events.ts";

type TEventName<T extends TBoardEventContext> = keyof TBoardEvents<T>;

function triggerEvent<T extends TBoardEventContext = TBoardEventContext>(
  events: TBoardEvents<T> | undefined,
  event: TEventName<T>,
  args: T
) {
  try {
    events?.[event]?.(args);
  } finally {
    if ("clearCache" in args && typeof args["clearCache"] === "function")
      (args as any).clearCache();
  }
}

export default triggerEvent;
