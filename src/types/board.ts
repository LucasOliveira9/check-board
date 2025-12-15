import CanvasLayers from "../engine/layers/canvasLayers";
import BoardRuntime from "../engine/boardRuntime/boardRuntime";
import {
  TBoardEventContext,
  TBoardEvents,
  TEvents,
  TMove,
  TMoveReturn,
} from "./events";
import { TPieceId, TPieceImage } from "./piece";
import { TSquare } from "./square";
import { THoverConfig } from "types";

type TBoardInjection<T extends TBoardEventContext> = (
  ctx: TBoardEventContext
) => T;

type TBoard = {
  boardRuntime: React.RefObject<BoardRuntime | null>;
  boardRef: React.RefObject<HTMLCanvasElement | null>;
  staticPiecesRef: React.RefObject<HTMLCanvasElement | null>;
  overlayRef: React.RefObject<HTMLCanvasElement | null>;
  underlayRef: React.RefObject<HTMLCanvasElement | null>;
  dynamicPiecesRef: React.RefObject<HTMLCanvasElement | null>;
  size: number;
};

interface TBoardRuntime<T extends TBoardEventContext = TBoardEventContext> {
  size: number;
  isBlackView: boolean;
  darkTile?: string;
  lightTile?: string;
  pieceConfig: TPieceConfig;
  board: string;
  events?: TBoardEvents;
  injection?: TBoardInjection<T>;
  pieceStyle?: TPieceImage;
  onMove?: (arg: TMove) => TMoveReturn;
  onUpdate?: () => void;
  defaultAnimation?: boolean;
  hoverConfig?: THoverConfig;
  canvasLayers: CanvasLayers;
  mode: "2d" | "3d";
}

type TPieceConfig<T = unknown> =
  | {
      type: "string";
      piecesImage?: TPieceImage<string>;
    }
  | {
      type: "image";
      piecesImage?: TPieceImage<HTMLImageElement>;
    }
  | {
      type: "custom";
      piecesImage: TPieceImage<T>;
    };

type TConfig<T extends TBoardEventContext = TBoardEventContext> = {
  isBlackView: boolean;
  size: number;
  board: string;
  pieceConfig: TPieceConfig;
  lightTile?: string;
  darkTile?: string;
  events?: TBoardEvents<T>;
  injection?: TBoardInjection<T>;
  defaultAnimation?: boolean;
  hoverConfig?: THoverConfig;
};

type TBoardProps = {
  config: TConfig;
  onMove?: (arg: TMove) => TMoveReturn;
  onUpdate?: () => void;
};

type TSelected = {
  id: TPieceId;
  x: number;
  y: number;
  square: TSquare;
  isDragging: boolean;
  startX: number | null;
  startY: number | null;
  secondClick: boolean;
};

const RenderExtends = {
  onToggleCanvas: "onToggleCanvas",
  onRender: "onRender",
} as const;
type TRenderExtends = keyof typeof RenderExtends;

type TPipelineRender = TEvents | TRenderExtends;

export type {
  TSelected,
  TBoard,
  TConfig,
  TBoardInjection,
  TPieceConfig,
  TBoardRuntime,
  TBoardProps,
  TPipelineRender,
};
