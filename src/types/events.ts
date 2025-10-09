import React from "react";
import { TSelected } from "./board";
import { TPieceId, TPieceImage, TPieceInternalRef } from "./piece";
import { TSquare } from "./square";

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
};

type TBoardEventContext = {
  ctx: CanvasRenderingContext2D;
  squareSize: number;
  size: number;
  x: number;
  y: number;
  piece?: TPieceInternalRef;
  piecesImage?: TPieceImage;
  square?: TSquare;
};

type TBoardEvent<T = TBoardEventContext> = (arg: T) => void;

type TBoardEvents<T extends TBoardEventContext = TBoardEventContext> = {
  select?: TBoardEvent<T>;
  hover?: TBoardEvent<T>;
  move?: TBoardEvent<T>;
  drop?: TBoardEvent<T>;
};

export type {
  TPointerDown,
  TPointerMove,
  TBoardEventContext,
  TBoardEvents,
  TBoardEvent,
};
