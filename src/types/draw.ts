import { TBoard, TBoardInjection, TSelected } from "./board";
import { TBoardEventContext, TBoardEvents } from "./events";
import { TPieceBoard, TPieceId, TPieceImage, TPieceInternalRef } from "./piece";

type TDrawBoard = {
  canvas: HTMLCanvasElement;
  lightTile: string;
  size: number;
  darkTile: string;
  isBlackView: boolean;
};

type TDrawPieces<T extends TBoardEventContext = TBoardEventContext> = {
  canvas: HTMLCanvasElement;
  size: number;
  isBlackView: boolean;
  internalRef: Record<TPieceId, TPieceInternalRef>;
  selectedRef: TSelected | null;
  pieceHoverRef: TPieceId | null;
  piecesImage?: TPieceImage;
  events?: TBoardEvents<T>;
  injection?: TBoardInjection<T>;
};

type TCanvasCoords = { x: number; y: number; w: number; h: number };
type TCanvasLayer =
  | "board"
  | "staticPieces"
  | "overlay"
  | "underlay"
  | "dynamicPieces";

type TRender = {
  piece: TPieceInternalRef;
  x: number;
  y: number;
};

type TDraw = {
  layer: TCanvasLayer;
};

type TSafeCtx = Omit<
  CanvasRenderingContext2D,
  | "clearRect"
  | "resetTransform"
  | "restore"
  | "save"
  | "scale"
  | "rotate"
  | "translate"
  | "transform"
  | "setTransform"
  | "clip"
  | "arcTo"
  | "canvas"
  | "filter"
  | "globalAlpha"
  | "globalCompositeOperation"
  | "direction"
>;

type TDrawRegion = { x: number; y: number; w: number; h: number; type: string };

export type {
  TDrawBoard,
  TDrawPieces,
  TRender,
  TCanvasCoords,
  TCanvasLayer,
  TSafeCtx,
  TDrawRegion,
};
