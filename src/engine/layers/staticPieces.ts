import BoardRuntime from "../BoardRuntime/BoardRuntime";
import BaseLayer from "./baseLayer";
import {
  TCanvasCoords,
  TDrawRegion,
  TPieceBoard,
  TPieceId,
  TPieceInternalRef,
} from "types";

class StaticPiecesLayer extends BaseLayer {
  constructor(boardRuntime: BoardRuntime) {
    super("staticPieces", boardRuntime);
  }
  update(delta: number): void {
    return;
  }

  draw(): void {
    const toRender = this.getToRender();
    const piecesImage = this.boardRuntime.getPieceStyle(),
      pieceHoverRef = this.boardRuntime.getPieceHover(),
      squareSize = this.boardRuntime.getSize() / 8,
      ctx = this.ctx;

    if (!piecesImage || !toRender || !toRender.length) return;
    if (
      typeof piecesImage.bB !== "string" &&
      !(piecesImage.bB instanceof HTMLImageElement)
    )
      return;

    if (!ctx) return;

    for (const id of toRender) {
      const piece = this.getPiece(id);
      if (!piece) continue;
      ctx.save();
      if (piecesImage && id !== pieceHoverRef) {
        let image = piecesImage[piece.type];
        if (image instanceof HTMLImageElement)
          this.DrawHTMLPiece(image, ctx, piece, squareSize);
        else if (typeof image === "string")
          this.DrawTextPiece(image, ctx, piece, squareSize);
      }
      ctx.restore();
      this.boardRuntime.renderer
        .getLayerManager()
        .applyDrawResult(ctx, "staticPieces", undefined, id);
    }

    this.clearRenderMap();
  }

  clearPieces(board: TPieceBoard[]) {
    const squareSize = this.boardRuntime.getSize() / 8;

    const newPieces = new Set<TPieceId>();
    for (const piece of board) {
      if (this.hasPiece(piece.id)) {
        newPieces.add(piece.id);
      }
    }

    for (const [id, piece] of this.pieces) {
      if (!newPieces.has(id)) {
        const coords: TCanvasCoords = {
          x: piece.x,
          y: piece.y,
          w: squareSize,
          h: squareSize,
        };

        this.addClearCoords(coords);
        this.removeAll?.(id);
      }
    }
  }

  private DrawHTMLPiece(
    image: HTMLImageElement,
    ctx: CanvasRenderingContext2D,
    piece: TPieceInternalRef,
    squareSize: number
  ) {
    if (image && image.complete && image.naturalWidth > 0) {
      ctx.drawImage(image, piece.x, piece.y, squareSize, squareSize);
    }
  }

  private DrawTextPiece(
    image: string,
    ctx: CanvasRenderingContext2D,
    piece: TPieceInternalRef,
    squareSize: number
  ) {
    const image_ = image.length > 1 ? image[0] : image;
    ctx.fillStyle = piece.type[0] === "w" ? "#ffffffff" : "#000000ff";
    ctx.font = `${squareSize * 0.7}px monospace`;
    let fontSize = squareSize * 0.7;
    ctx.font = `${fontSize}px monospace`;
    const textWidth = ctx.measureText(image_).width;
    if (textWidth > squareSize * 0.9) {
      fontSize *= (squareSize * 0.9) / textWidth;
      ctx.font = `${fontSize}px monospace`;
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(image_, piece.x + squareSize / 2, piece.y + squareSize / 2);
  }

  private DrawPathPiece(
    image: Path2D,
    ctx: CanvasRenderingContext2D,
    piece: TPieceInternalRef,
    squareSize: number
  ) {
    ctx.save();
    ctx.translate(piece.x + squareSize / 2, piece.y + squareSize / 2);
    const scale = squareSize / 100;
    ctx.scale(scale, scale);
    ctx.fillStyle = piece.type.startsWith("w") ? "#fff" : "#000";
    ctx.fill(image);
    ctx.restore();
  }
}

export default StaticPiecesLayer;
