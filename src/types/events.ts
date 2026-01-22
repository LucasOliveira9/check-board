import { TSelected } from "./board";
import { TCanvasLayer, TCanvasLayerClient, TSafeCtx } from "./draw";
import {
  TPiece,
  TPieceBoard,
  TPieceId,
  TPieceImage,
  TPieceInternalRef,
} from "./piece";
import { TNotation, TSquare } from "./square";
import { TDeepReadonly } from "./utils";

type TPointerDown = {
  e: React.PointerEvent<HTMLCanvasElement>;
  size: number;
  isBlackView: boolean;
  selectedRef: React.RefObject<TSelected | null>;
  internalRef: React.RefObject<Record<TPieceId, TPieceInternalRef>>;
};

type TPointerMove = {
  e: React.PointerEvent<HTMLCanvasElement>;
  size: number;
  isBlackView: boolean;
  selectedRef: React.RefObject<TSelected | null>;
  internalRef: React.RefObject<Record<TPieceId, TPieceInternalRef>>;
  pieceHoverRef: React.RefObject<TPieceId | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
};

type TBoardEventContextBase = {
  squareSize: number;
  size: number;
  x: number;
  y: number;
};

type TBoardEventContextExtras = {
  piece?: TPieceInternalRef | null;
  piecesImage?: TPieceImage | null;
  square?: TSquare | null;
  pieces?: Record<TPieceId, TPieceInternalRef>;
  pieceHover?: TPieceId | null;
  selected?: TSelected | null;
  isBlackView?: boolean;
  lightTile?: string;
  darkTile?: string;
  animation?: TDeepReadonly<TAnimation[]>;
  draw?: TDrawFunction;
};

type TDrawFunction = {
  (opts: { onDraw: (ctx: TSafeCtx) => void; layer: TCanvasLayerClient }): void;

  batch: (
    opts: {
      onDraw: (ctx: TSafeCtx) => void;
      layer: TCanvasLayerClient;
    }[],
  ) => void;

  group: (
    layer: TCanvasLayerClient,
    fn: (
      ctx: TSafeCtx,
      g: {
        draw: (onDraw: (ctx: TSafeCtx) => void) => void;
      },
    ) => void,
  ) => void;
};

type TAnimation = {
  from: { x: number; y: number };
  to: { x: number; y: number };
  piece: TPieceInternalRef;
  start: number;
  id: TPieceId;
};

type TMove = {
  from: TNotation;
  to: TNotation;
  piece: TPieceBoard;
};

type TMoveReturn = {
  status: boolean;
  result: TMoveResult;
};

type TMoveResult = {
  from: TNotation;
  to: TNotation;
  captured: TNotation[];
  promotion?: "q" | "r" | "n" | "b" | "p" | "k";
}[];

type TMoveUndo = TUndo[];

type TUndo = {
  from: TNotation;
  to: TNotation;
  captured: { square: TNotation; type: TPiece }[];
  moved: TPiece;
  promoted: boolean;
};

type TListener = (...args: any[]) => void;

interface IEventListener {
  on(event: TEventListenerEvents, listener: TListener): () => void;
  once(event: TEventListenerEvents, listener: TListener): () => void;
  off(event: TEventListenerEvents, listener: TListener): void;
}
const EVENT_LISTENER_EVENTS = {
  onMoveAbort: "onMoveAbort",
  onPointerDown: "onPointerDown",
  onPointerMove: "onPointerMove",
  onPointerUp: "onPointerUp",
} as const;

type TEventListenerEvents =
  (typeof EVENT_LISTENER_EVENTS)[keyof typeof EVENT_LISTENER_EVENTS];

const EVENTS = {
  onPointerSelect: "onPointerSelect",
  onPointerHover: "onPointerHover",
  onPointerDragStart: "onPointerDragStart",
  onPointerDrag: "onPointerDrag",
  onPointerDrop: "onPointerDrop",
  onAnimationFrame: "onAnimationFrame",
  onDrawPiece: "onDrawPiece",
  onDrawBoard: "onDrawBoard",
  onDrawOverlay: "onDrawOverlay",
  onDrawUnderlay: "onDrawUnderlay",
} as const;

type TEvents = keyof typeof EVENTS;

type TBoardEventContext = TBoardEventContextBase &
  Partial<TBoardEventContextExtras>;

type TBoardEvent<T = TBoardEventContext, E = void> = E extends void
  ? (arg: T) => void
  : (arg: T, extra: E) => void;

type TBoardEventExtras = {
  onPointerSelect: void;
  onPointerHover: void;
  onPointerDragStart: void;
  onPointerDrag: void;
  onPointerDrop: void;
  onAnimationFrame: void;
  onDrawPiece: void;
  onDrawBoard: void;
  onDrawOverlay: void;
  onDrawUnderlay: void;
};

type TBoardEvents<
  T extends TGetterBoardEventContext = TGetterBoardEventContext,
  E extends Record<string, any> = TBoardEventExtras,
> = {
  [K in keyof E]?: TBoardEvent<T, E[K]>;
};

type TGetterProp<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type TGetterBoardEventContext = TGetterProp<TBoardEventContextExtras> &
  TBoardEventContextBase;

export type {
  TPointerDown,
  TPointerMove,
  TBoardEventContext,
  TBoardEvents,
  TBoardEvent,
  TBoardEventExtras,
  TBoardEventContextBase,
  TBoardEventContextExtras,
  TMove,
  TMoveReturn,
  TMoveResult,
  TMoveUndo,
  TUndo,
  TAnimation,
  TGetterBoardEventContext,
  TEvents,
  TDrawFunction,
  TListener,
  IEventListener,
  TEventListenerEvents,
};

export { EVENTS };
