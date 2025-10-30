import { TBoardEvents, TGetterBoardEventContext } from "./events";
import { TPieceInternalRef, TPieceId } from "./piece";
import { TNotation } from "./square";

type TResolvers<T> = { [K in keyof T]: (...args: any[]) => T[K] };
type TBase = Record<string, any>;
type TResolved = Record<string, any>;
type TLazyReturn<TBase, TResolved> = TBase & {
  [K in keyof TResolved]: (
    ...args: Parameters<TResolvers<TResolved>[K]>
  ) => ReturnType<TResolvers<TResolved>[K]>;
} & {
  toPlain: () => TBase & TResolved;
  clearCache: () => void;
};
type TEventName<T extends TGetterBoardEventContext> = keyof TBoardEvents<T>;

type TCache = Map<TNotation, { piece: TPieceInternalRef; id: TPieceId }>;

export type { TResolvers, TBase, TResolved, TLazyReturn, TCache, TEventName };
