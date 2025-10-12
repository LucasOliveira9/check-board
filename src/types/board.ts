import { TBoardEventContext, TBoardEvents } from "./events.ts";
import {
  TPiece,
  TPieceBoard,
  TPieceDisplay,
  TPieceId,
  TPieceImage,
} from "./piece.ts";
import { TSquare } from "./square.ts";

type TBoardInjection<T extends TBoardEventContext> = (
  ctx: TBoardEventContext
) => T;
type TBoard<
  T extends TBoardEventContext = TBoardEventContext,
  TDisplay = TPieceDisplay
> = {
  config: TConfig;
  pieceConfig: TPieceConfig;
  events?: TBoardEvents;
  injection?: TBoardInjection<T>;
  pieces: TPieceBoard[];
};

type TPieceConfig =
  | {
      type: "string";
      piecesImage?: TPieceImage<string>;
    }
  | {
      type: "image";
      piecesImage?: TPieceImage<HTMLImageElement>;
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

export type { TSelected, TBoard, TConfig, TBoardInjection, TPieceConfig };
