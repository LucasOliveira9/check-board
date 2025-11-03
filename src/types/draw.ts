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

type TRender = {
  id: TPieceId;
  piece: TPieceInternalRef;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type { TDrawBoard, TDrawPieces, TRender };
