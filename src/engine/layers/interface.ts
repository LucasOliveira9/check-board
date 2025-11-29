import {
  TPieceId,
  TPieceInternalRef,
  TEvents,
  TCanvasCoords,
  TDrawRegion,
} from "types";

export interface ICanvasLayer {
  name: string;
  update(delta: number): void;
  clear(
    ctx: CanvasRenderingContext2D & {
      __drawRegions: TDrawRegion[];
      __clearRegions: () => void;
    }
  ): void;
  draw(
    ctx: CanvasRenderingContext2D & {
      __drawRegions: TDrawRegion[];
      __clearRegions: () => void;
    }
  ): void;
  addPiece?(pieceId: TPieceId, ref: TPieceInternalRef): void;
  removePiece?(pieceId: TPieceId): void;
  handleEvent?(event: TEvents, coords: TCanvasCoords): void;
}
