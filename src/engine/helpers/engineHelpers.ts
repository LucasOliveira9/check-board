import { TEventName, TLazyReturn, TResolvers } from "../../types/helpers";
import BoardRuntime from "../boardRuntime/boardRuntime";
import PieceHelpers from "./pieceHelpers";
import { TBoardEventContext, TBoardEvents } from "../../types/events";
import { TNotation } from "../../types/square";
import { TPieceBoard } from "../../types/piece";
import { TCanvasCoords } from "../../types/draw";
import PointerEventsHelpers from "./pointerEventsHelpers";

class EngineHelpers {
  public pointerEventsHelper: PointerEventsHelpers;
  public pieceHelper: PieceHelpers = new PieceHelpers();
  constructor(protected boardRuntime: BoardRuntime) {
    this.pointerEventsHelper = new PointerEventsHelpers(this.boardRuntime);
  }

  destroy() {
    this.pieceHelper.destroy();
    this.pointerEventsHelper.destroy();
    for (const key of Object.getOwnPropertyNames(this)) {
      (this as any)[key] = null;
    }
  }

  createLazyEventContext<TBase, TResolved>(
    base: TBase,
    resolvers: TResolvers<TResolved>,
    opts?: { cache: boolean }
  ): TLazyReturn<TBase, TResolved> {
    const cache = new Map<string, any>();
    const result: any = { ...base };
    const useCache = opts?.cache ?? true;

    for (const key of Object.keys(resolvers) as Array<keyof TResolved>) {
      result[key] = (...args: any[]) => {
        if (useCache && cache.has(key as string))
          return cache.get(key as string);

        const value = (resolvers as any)[key](...args);
        if (useCache) cache.set(key as string, value);
        return value;
      };
    }

    result.toPlain = () => {
      const plain: any = { ...base };
      for (const k of Object.keys(resolvers) as Array<keyof TResolved>) {
        plain[k] = (resolvers as any)[k]();
      }
      return plain as TBase & TResolved;
    };

    result.clearCache = () => cache.clear();

    result.destroy = () => {
      cache.clear();
      for (const key of Object.keys(result)) {
        delete (result as any)[key];
      }
    };

    return result;
  }

  triggerEvent<T extends TBoardEventContext = TBoardEventContext>(
    events: TBoardEvents<T> | undefined,
    event: TEventName<T>,
    args: T
  ): void;
  triggerEvent<T extends TBoardEventContext = TBoardEventContext, K = unknown>(
    events: TBoardEvents<T> | undefined,
    event: TEventName<T>,
    args: T,
    extra: K
  ): void;
  triggerEvent<T extends TBoardEventContext = TBoardEventContext, K = unknown>(
    events: TBoardEvents<T> | undefined,
    event: TEventName<T>,
    args: T,
    extra?: K
  ) {
    let res = null;
    try {
      const fn = events?.[event];
      if (!fn) return;
      (args as any).__event = event;

      if (extra !== undefined) {
        res = (fn as (arg: T, extra: K) => TCanvasCoords[] | null | undefined)(
          args,
          extra
        );
      } else {
        res = (fn as (arg: T) => TCanvasCoords[] | null | undefined)(args);
      }
    } finally {
      if ("destroy" in args && typeof args["destroy"] === "function")
        (args as any).destroy();
    }
    return res;
  }

  move(
    from: TNotation,
    to: TNotation,
    piece: TPieceBoard,
    click: boolean,
    offset: { x: number; y: number }
  ) {
    if (from === to) return false;
    const selected = this.boardRuntime.getSelected();
    const id = selected?.id;
    const moveCallback = this.boardRuntime.getMove();
    if (moveCallback) {
      const move = moveCallback({ from, to, piece });
      if (move) {
        if (selected && selected.isDragging && id) {
          this.pointerEventsHelper.endDrag(offset.x, offset.y, true, false);
          this.toggleSelected(false);
          this.boardRuntime.pipelineRender.setNextEvent("onToggleCanvas", [
            "dynamicPieces",
            "staticPieces",
            id,
            true,
          ]);
        }
        this.boardRuntime.updateBoardState(from, to, click);
        return true;
      } else {
        if (selected) {
          if (selected.isDragging && id) {
            this.pointerEventsHelper.endDrag(offset.x, offset.y, false, false);
            this.toggleSelected(false);
            this.boardRuntime.pipelineRender.setNextEvent("onToggleCanvas", [
              "dynamicPieces",
              "staticPieces",
              id,
            ]);
          } else this.toggleSelected(true);
        }

        return false;
      }
    } else {
      // DEFAULT
      if (selected && selected.isDragging) {
        this.pointerEventsHelper.endDrag(offset.x, offset.y, true, false);
        this.toggleSelected(false);
        this.boardRuntime.pipelineRender.setNextEvent("onToggleCanvas", [
          "dynamicPieces",
          "staticPieces",
          id,
          true,
        ]);
      } else this.toggleSelected(true);
      this.boardRuntime.updateBoardState(from, to, click);
    }
    return true;
  }

  toggleSelected(keep: boolean) {
    const selected = this.boardRuntime.getSelected();
    if (!selected) return;
    if (keep)
      this.boardRuntime.pipelineRender.setNextEvent("onPointerSelect", [
        {
          ...selected,
          isDragging: false,
          startX: null,
          startY: null,
          secondClick: false,
        },
        true,
      ]);
    else
      this.boardRuntime.pipelineRender.setNextEvent("onPointerSelect", [
        null,
        true,
      ]);
  }
}

export default EngineHelpers;
