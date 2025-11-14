import { TSelected } from "./board";
import { TCanvasLayer, TSafeCtx } from "./draw";
import { TPieceBoard, TPieceId, TPieceImage, TPieceInternalRef } from "./piece";
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
  animation?: TDeepReadonly<TAnimation>;
  draw?: (opts: {
    onDraw: (ctx: TSafeCtx) => void;
    layer: TCanvasLayer;
    event: TEvents;
  }) => void;
};

type TAnimation = {
  from: { x: number; y: number };
  to: { x: number; y: number };
  piece: TPieceInternalRef;
  start: number;
  id: TPieceId;
}[];

type TMove = {
  from: TNotation;
  to: TNotation;
  piece: TPieceBoard;
};

type TEvents =
  | "onPointerSelect"
  | "onPointerHover"
  | "onPointerDragStart"
  | "onPointerDrag"
  | "onPointerDrop"
  | "onAnimationFrame"
  | "onDrawPiece"
  | "onDrawBoard"
  | "onDrawOverlay"
  | "onDrawUnderlay";

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
  E extends Record<string, any> = TBoardEventExtras
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
  TAnimation,
  TGetterBoardEventContext,
  TEvents,
};
