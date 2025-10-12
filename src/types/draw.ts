import { TBoard, TBoardInjection, TSelected } from "./board.ts";
import { TBoardEventContext, TBoardEvents } from "./events.ts";
import {
  TPieceBoard,
  TPieceId,
  TPieceImage,
  TPieceInternalRef,
} from "./piece.ts";

export type TDrawBoard<T extends TBoardEventContext = TBoardEventContext> = {
  canvas: HTMLCanvasElement;
  lightTile: string;
  size: number;
  darkTile: string;
  isBlackView: boolean;
  internalRef: React.RefObject<Record<TPieceId, TPieceInternalRef>>;
  selectedRef: React.RefObject<TSelected | null>;
  pieceHoverRef: React.RefObject<TPieceId | null>;
  piecesImage?: TPieceImage;
  events?: TBoardEvents<T>;
  injection?: TBoardInjection<T>;
};
