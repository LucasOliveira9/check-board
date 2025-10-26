import { TBoardEventContext, TBoardEvents } from "./events";
import { TPieceInternalRef, TPieceId } from "./piece";
import { TNotation } from "./square";

type TResolvers<T> = { [k in keyof T]: () => T[k] };
type TBase = Record<string, any>;
type TResolved = Record<string, any>;
type TLazyReturn<TBase, TResolved> = TBase &
  TResolved & {
    toPlain: () => TBase & TResolved;
    clearCache: () => void;
  };
type TEventName<T extends TBoardEventContext> = keyof TBoardEvents<T>;

type TCache = Map<TNotation, { piece: TPieceInternalRef; id: TPieceId }>;

export type { TResolvers, TBase, TResolved, TLazyReturn, TCache, TEventName };
