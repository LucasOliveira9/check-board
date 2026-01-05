import Utils from "../../utils/utils";
import BoardRuntime from "../boardRuntime/boardRuntime";
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

  updateClear(): void {
    const checked: Set<TPieceId> = new Set();
    for (const coords of this.clearQueue) {
      const search = this.spatialIndex.search(coords);
      for (const s of search) {
        const id = s.id as TPieceId;
        const { P1, P2, P3, P4 } = Utils.getHashingNumbers();
        const hash =
          (P1 * s.box.x) ^ (P2 * s.box.y) ^ (P3 * s.box.w) ^ (P4 * s.box.h);
        if (
          checked.has(id) ||
          this.renderMap.has(id) ||
          coords.id === id ||
          this.clearQueueHash.has(hash)
        )
          continue;

        this.addClearQueue({ ...s.box, id });
        this.renderMap.add(id);
        checked.add(id);
        //debug
        this.ctx &&
          ((this.ctx.strokeStyle = "rgba(251, 0, 0, 1)"),
          (this.ctx.lineWidth = 8));
        this.ctx?.strokeRect(coords.x, coords.y, coords.w, coords.h);
        console.log(coords.id, " --- ", s.id, s.box, coords);
      }
    }
  }
  update(delta: number): void {
    return;
  }

  async draw(): Promise<void> {
    const toRender = this.getToRender();
    const piecesImage = this.boardRuntime.getPieceStyle(),
      pieceHoverRef = this.boardRuntime.getPieceHover(),
      squareSize = Math.ceil(this.boardRuntime.getSize() / 8),
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
    const squareSize = Math.ceil(this.boardRuntime.getSize() / 8);

    const newPieces = new Set<TPieceId>();
    for (const piece of board) {
      if (this.hasPiece(piece.id)) {
        newPieces.add(piece.id);
      }
    }

    for (const [id, piece] of this.pieces) {
      if (
        !newPieces.has(id) &&
        !this.boardRuntime.renderer.getLayerManager().isDelayedPieceClear(id)
      ) {
        const coords: TCanvasCoords = {
          x: piece.x,
          y: piece.y,
          w: squareSize,
          h: squareSize,
        };

        this.addClearQueue({ ...coords, id });
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
    const coords = Utils.squareToCoords(
      piece.square,
      squareSize,
      this.boardRuntime.getIsBlackView()
    );
    if (!coords) return;

    if (image && image.complete && image.naturalWidth > 0) {
      ctx.drawImage(image, coords.x, coords.y, squareSize, squareSize);
    }
  }

  private DrawTextPiece(
    image: string,
    ctx: CanvasRenderingContext2D,
    piece: TPieceInternalRef,
    squareSize: number
  ) {
    const coords = Utils.squareToCoords(
      piece.square,
      squareSize,
      this.boardRuntime.getIsBlackView()
    );
    if (!coords) return;

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
    ctx.fillText(image_, coords.x + squareSize / 2, coords.y + squareSize / 2);
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
