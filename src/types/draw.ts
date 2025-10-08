import { TPieceBoard, TPieceId, TPieceImage, TPieceInternalRef } from "./piece";

export type TDrawBoard = {
  canvas: HTMLCanvasElement;
  lightTile: string;
  size: number;
  darkTile: string;
  isBlackView: boolean;
  internalRef: React.RefObject<Record<TPieceId, TPieceInternalRef>>;
  piecesImage?: TPieceImage;
};
