import { TPiece, TPieceBoard, TPieceImage } from "./piece";

export type TBoard = {
  config: TConfig;
  piecesImage?: TPieceImage;
  pieces: TPieceBoard[];
};

export type TConfig = {
  isBlackView: boolean;
  size: number;
  lightTile: string;
  darkTile: string;
};
