import {
  TPieceDisplay,
  TPieceId,
  TPieceImage,
  TPieceInternalRef,
  TPieceKey,
} from "../../types/piece";
import { TNotation } from "../../types/square";
import { coordsToSquare } from "../../utils/coords";
import { TCache } from "../../types/helpers";

class PieceHelpers {
  private imagesSrc = {
    wP: "assets/WhitePawn.svg",
    wB: "assets/WhiteBishop.svg",
    wN: "assets/WhiteKnight.svg",
    wR: "assets/WhiteRook.svg",
    wQ: "assets/WhiteQueen.svg",
    wK: "assets/WhiteKing.svg",
    bP: "assets/BlackPawn.svg",
    bB: "assets/BlackBishop.svg",
    bN: "assets/BlackKnight.svg",
    bR: "assets/BlackRook.svg",
    bQ: "assets/BlackQueen.svg",
    bK: "assets/BlackKing.svg",
  };
  private cache: TCache = new Map();

  destroy() {
    this.clearCache();

    const images = this.getPieceImages?.image;
    if (images) {
      for (const key in images) {
        const img = images[key as TPieceKey];
        if (img instanceof HTMLImageElement) {
          img.src = "";
          img.onload = null;
          img.onerror = null;
        }
        (images as any)[key] = null;
      }
    }

    for (const key of Object.getOwnPropertyNames(this)) {
      (this as any)[key] = null;
    }
  }

  getPieceAt(
    x: number,
    y: number,
    squareSize: number,
    isBlackView: boolean,
    internalRef: Record<TPieceId, TPieceInternalRef>
  ) {
    const refObj = internalRef;
    if (!refObj) return;
    const square = coordsToSquare(x, y, squareSize, isBlackView);
    if (!square) return;
    const cached = this.cache.get(square.notation);
    if (cached) return { piece: { ...cached.piece }, id: cached.id };

    const piece = Object.entries(refObj).find(([_, piece]) => {
      return piece.square.notation === square.notation;
    });

    if (!piece) return;
    const [id, p] = piece;

    this.cache.set(square.notation, {
      piece: p,
      id: id as TPieceId,
    });
    return { id: id as TPieceId, piece: p };
  }

  clearCache() {
    return this.cache.clear();
  }

  updateCache(
    from: TNotation,
    to: TNotation,
    piece: { id: TPieceId; piece: TPieceInternalRef }
  ) {
    this.cache.delete(from);
    this.cache.set(to, piece);
  }

  getPieceImages: Record<string, TPieceImage<TPieceDisplay>> = {
    string: {
      wK: "♔",
      wQ: "♕",
      wR: "♖",
      wB: "♗",
      wN: "♘",
      wP: "♙",
      bK: "♔",
      bQ: "♕",
      bR: "♖",
      bB: "♗",
      bN: "♘",
      bP: "♙",
    },
    image: (() => {
      const loadImage = (src: string) => {
        const image = new Image();
        image.src = src;
        return image;
      };
      return {
        wP: loadImage(this.imagesSrc["wP"]),
        wB: loadImage(this.imagesSrc["wB"]),
        wR: loadImage(this.imagesSrc["wR"]),
        wN: loadImage(this.imagesSrc["wN"]),
        wQ: loadImage(this.imagesSrc["wQ"]),
        wK: loadImage(this.imagesSrc["wK"]),
        bP: loadImage(this.imagesSrc["bP"]),
        bB: loadImage(this.imagesSrc["bB"]),
        bR: loadImage(this.imagesSrc["bR"]),
        bN: loadImage(this.imagesSrc["bN"]),
        bQ: loadImage(this.imagesSrc["bQ"]),
        bK: loadImage(this.imagesSrc["bK"]),
      };
    })(),
  };

  async preloadImages(images: TPieceImage<TPieceDisplay>): Promise<void> {
    const ImagePromises = Object.values(images).map((img) => {
      return new Promise<void>((resolve) => {
        if (!(img instanceof HTMLImageElement)) resolve();
        else if (img.complete && img.naturalWidth > 0) resolve();
        else {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }
      });
    });

    await Promise.all(ImagePromises);
  }
}

export default PieceHelpers;
