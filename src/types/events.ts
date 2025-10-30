import { TSelected } from "./board";
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
  ctx: CanvasRenderingContext2D;
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
  canvas?: HTMLCanvasElement;
  animation?: TDeepReadonly<TAnimation>;
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

type TBoardEventContext = TBoardEventContextBase &
  Partial<TBoardEventContextExtras>;

type TBoardEvent<T = TBoardEventContext, E = void> = E extends void
  ? (arg: T) => void
  : (arg: T, extra: E) => void;

type TBoardEventExtras = {
  select: void;
  hover: void;
  drop: void;
  drawPiece: number;
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
};
