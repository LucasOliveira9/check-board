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
  getPiece?: TPieceInternalRef | null;
  getPiecesImage?: TPieceImage | null;
  getSquare?: TSquare | null;
  getPieces?: Record<TPieceId, TPieceInternalRef>;
  getPieceHover?: TPieceId | null;
  getSelected?: TSelected | null;
  getIsBlackView?: boolean;
  getLightTile?: string;
  getDarkTile?: string;
  getCanvas?: HTMLCanvasElement;
  getAnimation?: TDeepReadonly<TAnimation>;
};

type TAnimation = {
  from: { x: number; y: number };
  to: { x: number; y: number };
  piece: TPieceInternalRef;
  start: number;
}[];

type TMove = {
  from: TNotation;
  to: TNotation;
  piece: TPieceBoard;
};

type TBoardEventContext = TBoardEventContextBase &
  Partial<TBoardEventContextExtras>;

type TBoardEvent<T = TBoardEventContext> = (arg: T) => void;

type TBoardEvents<T extends TBoardEventContext = TBoardEventContext> = {
  select?: TBoardEvent<T>;
  hover?: TBoardEvent<T>;
  move?: TBoardEvent<T>;
  drop?: TBoardEvent<T>;
  drawPiece?: TBoardEvent<T>;
};

export type {
  TPointerDown,
  TPointerMove,
  TBoardEventContext,
  TBoardEvents,
  TBoardEvent,
  TBoardEventContextBase,
  TBoardEventContextExtras,
  TMove,
  TAnimation,
};
