import { TSelected } from "./board";
import { TPieceBoard, TPieceId, TPieceImage, TPieceInternalRef } from "./piece";
import { TNotation, TSquare } from "./square";

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
  piece?: TPieceInternalRef;
  piecesImage?: TPieceImage;
  square?: TSquare;
  internalRef?: Record<TPieceId, TPieceInternalRef>;
  pieceHoverRef?: TPieceId | null;
  selectedRef?: TSelected | null;
  isBlackView?: boolean;
  lightTile?: string;
  darkTile?: string;
  canvas?: HTMLCanvasElement;
  animation?: {
    from: { x: number; y: number };
    to: { x: number; y: number };
    piece: TPieceInternalRef;
    start: number;
  }[];
};

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
};
