import { TBoardEventContext, TBoardEvents } from "./events.ts";
import { TPiece, TPieceBoard, TPieceId, TPieceImage } from "./piece.ts";
import { TSquare } from "./square.ts";

type TBoardInjection<T extends TBoardEventContext> = (
  ctx: TBoardEventContext
) => T;
type TBoard<T extends TBoardEventContext = TBoardEventContext> = {
  config: TConfig;
  piecesImage?: TPieceImage;
  events?: TBoardEvents;
  injection?: TBoardInjection<T>;
  pieces: TPieceBoard[];
};

type TConfig = {
  isBlackView: boolean;
  size: number;
  lightTile?: string;
  darkTile?: string;
};

type TSelected = {
  id: TPieceId;
  x: number;
  y: number;
  square: TSquare;
  isDragging: boolean;
  startX: number | null;
  startY: number | null;
};

export type { TSelected, TBoard, TConfig, TBoardInjection };
