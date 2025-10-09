import { TBoardEventContext, TBoardEvents } from "src/types/events";

type TEventName = keyof TBoardEvents;

function triggerEvent<T extends TBoardEventContext = TBoardEventContext>(
  events: TBoardEvents | undefined,
  event: TEventName,
  args: TBoardEventContext
) {
  events?.[event]?.(args as T);
}

export default triggerEvent;
