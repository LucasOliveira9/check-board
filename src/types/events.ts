import React from "react";
import { TSelected } from "./board.ts";
import { TPieceId, TPieceImage, TPieceInternalRef } from "./piece.ts";
import { TSquare } from "./square.ts";

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
  internalRef?: React.RefObject<Record<TPieceId, TPieceInternalRef>>;
  pieceHoverRef?: React.RefObject<TPieceId | null>;
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
};
