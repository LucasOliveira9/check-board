import { TNotation } from "../types/square";
import { TPieceId, TPieceInternalRef } from "../types/piece";
import { coordsToSquare } from "../utils/coords";

type TCache = Map<TNotation, { piece: TPieceInternalRef; id: TPieceId }>;

const cache: TCache = new Map();

const getPiece = {
  at: getPieceAt,
  clearCache: () => cache.clear(),
  updateCache: (
    from: TNotation,
    to: TNotation,
    piece: { id: TPieceId; piece: TPieceInternalRef }
  ) => {
    cache.delete(from);
    cache.set(to, piece);
  },
};

function getPieceAt(
  x: number,
  y: number,
  squareSize: number,
  isBlackView: boolean,
  internalRef: React.RefObject<Record<TPieceId, TPieceInternalRef>>
): { id: TPieceId; piece: TPieceInternalRef } | undefined {
  const refObj = internalRef.current;
  if (!refObj) return;
  const square = coordsToSquare(x, y, squareSize, isBlackView);
  if (!square) return;
  const cached = cache.get(square.notation);
  if (cached) return { piece: { ...cached.piece }, id: cached.id };

  const piece = Object.entries(refObj).find(([_, piece]) => {
    return piece.square.notation === square.notation;
  });

  if (!piece) return;
  const [id, p] = piece;

  cache.set(square.notation, {
    piece: p,
    id: id as TPieceId,
  });
  return { id: id as TPieceId, piece: p };
}

export { getPiece };
