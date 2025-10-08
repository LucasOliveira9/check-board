import { TSelected } from "./board";
import { TPieceId, TPieceInternalRef } from "./piece";

type TPointerDown = {
  e: React.PointerEvent<HTMLCanvasElement>;
  size: number;
  isBlackView: boolean;
  selectedRef: React.RefObject<TSelected | null>;
  internalRef: React.RefObject<Record<TPieceId, TPieceInternalRef>>;
};

export type { TPointerDown };
