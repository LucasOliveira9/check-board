import { TBoard, TBoardInjection, TSelected } from "./board";
import { TBoardEventContext, TBoardEvents } from "./events";
import { TPieceBoard, TPieceId, TPieceImage, TPieceInternalRef } from "./piece";

export type TDrawBoard<T extends TBoardEventContext = TBoardEventContext> = {
  canvas: HTMLCanvasElement;
  lightTile: string;
  size: number;
  darkTile: string;
  isBlackView: boolean;
  internalRef: React.RefObject<Record<TPieceId, TPieceInternalRef>>;
  selectedRef: React.RefObject<TSelected | null>;
  piecesImage?: TPieceImage;
  events?: TBoardEvents<T>;
  injection?: TBoardInjection<T>;
};
