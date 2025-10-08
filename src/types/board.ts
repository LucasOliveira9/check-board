import { TPiece, TPieceBoard, TPieceId, TPieceImage } from "./piece";
import { TSquare } from "./square";

type TBoard = {
  config: TConfig;
  piecesImage?: TPieceImage;
  pieces: TPieceBoard[];
};

type TConfig = {
  isBlackView: boolean;
  size: number;
  lightTile: string;
  darkTile: string;
};

type TSelected = {
  id: TPieceId;
  x: number;
  y: number;
  square: TSquare;
  isDragging: boolean;
};

export type { TSelected, TBoard, TConfig };
