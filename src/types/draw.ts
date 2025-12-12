import { TBoardInjection, TSelected } from "./board";
import { TBoardEventContext, TBoardEvents } from "./events";
import { TPieceId, TPieceImage, TPieceInternalRef } from "./piece";

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

type TCanvasCoords = {
  x: number;
  y: number;
  w: number;
  h: number;
  id?: string;
};
const CANVAS_LAYERS = {
  board: { name: "board", client: false },
  staticPieces: { name: "staticPieces", client: false },
  overlay: { name: "overlay", client: true },
  underlay: { name: "underlay", client: true },
  dynamicPieces: { name: "dynamicPieces", client: false },
} as const;

type TCanvasLayer = keyof typeof CANVAS_LAYERS;

type TCanvasLayerClient = {
  [K in TCanvasLayer]: (typeof CANVAS_LAYERS)[K]["client"] extends true
    ? K
    : never;
}[TCanvasLayer];

type TRender = {
  piece: TPieceInternalRef;
  x: number;
  y: number;
};

type THoverConfig = {
  highlight: boolean;
  scaling: boolean;
  scaleAmount: number;
};

type TBaseCtx = CanvasRenderingContext2D & {
  __drawRegions: TDrawRegion[];
  __clearRegions: () => void;
  __actualRegions: TCanvasCoords[];
};

type TSafeCtx = Omit<
  CanvasRenderingContext2D,
  | "clearRect"
  | "resetTransform"
  | "restore"
  | "save"
  | "scale"
  | "rotate"
  | "translate"
  | "transform"
  | "setTransform"
  | "clip"
  | "arcTo"
  | "canvas"
  | "filter"
  | "globalAlpha"
  | "globalCompositeOperation"
  | "direction"
>;

type TDrawRegion = { x: number; y: number; w: number; h: number; type: string };

export type {
  TDrawBoard,
  TDrawPieces,
  TRender,
  TCanvasCoords,
  TCanvasLayer,
  TSafeCtx,
  TBaseCtx,
  TDrawRegion,
  TCanvasLayerClient,
  THoverConfig,
};
