import CanvasLayers from "../engine/BoardRuntime/canvasLayers";
import BoardRuntime from "../engine/BoardRuntime/BoardRuntime";
import { TBoardEventContext, TBoardEvents, TMove } from "./events";
import {
  TPiece,
  TPieceBoard,
  TPieceDisplay,
  TPieceId,
  TPieceImage,
  TPieceInternalRef,
} from "./piece";
import { TSquare } from "./square";

type TBoardInjection<T extends TBoardEventContext> = (
  ctx: TBoardEventContext
) => T;

type TBoardEngine = {
  config: TConfig;
};

type TBoard = {
  boardRuntime: React.RefObject<BoardRuntime | null>;
  boardRef: React.RefObject<HTMLCanvasElement | null>;
  piecesRef: React.RefObject<HTMLCanvasElement | null>;
  overlayRef: React.RefObject<HTMLCanvasElement | null>;
  size: number;
};

interface TBoardRuntime<T extends TBoardEventContext = TBoardEventContext> {
  size: number;
  isBlackView: boolean;
  darkTile?: string;
  lightTile?: string;
  pieceConfig: TPieceConfig;
  board: TPieceBoard[];
  events?: TBoardEvents;
  injection?: TBoardInjection<T>;
  pieceStyle?: TPieceImage<TPieceDisplay>;
  move?: (arg: TMove) => TPieceBoard[] | void | false;
  defaultAnimation?: boolean;
  canvasLayers: CanvasLayers;
}

type TPieceConfig =
  | {
      type: "string";
      piecesImage?: TPieceImage<string>;
    }
  | {
      type: "image";
      piecesImage?: TPieceImage<HTMLImageElement>;
    };

type TConfig<T extends TBoardEventContext = TBoardEventContext> = {
  isBlackView: boolean;
  size: number;
  board: TPieceBoard[];
  pieceConfig: TPieceConfig;
  lightTile?: string;
  darkTile?: string;
  events?: TBoardEvents<T>;
  injection?: TBoardInjection<T>;
  move?: (arg: TMove) => TPieceBoard[] | void | false;
  defaultAnimation?: boolean;
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

export type {
  TSelected,
  TBoard,
  TConfig,
  TBoardInjection,
  TPieceConfig,
  TBoardEngine,
  TBoardRuntime,
};
