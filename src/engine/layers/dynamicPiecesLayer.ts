import BoardRuntime from "../boardRuntime/boardRuntime";
import BaseLayer from "./baseLayer";
import { TDrawRegion, TEvents, TPieceId, TPieceInternalRef } from "types";
import Utils from "../../utils/utils";

class DynamicPiecesLayer extends BaseLayer {
  private scale: number = 1.1;
  private toggleCanvas: TPieceId[] = [];
  constructor(boardRuntime: BoardRuntime) {
    super("dynamicPieces", boardRuntime);
  }

  updateClear(): void {
    const CLEAR: TEvents[] = ["onPointerDrag"];
    for (const e of CLEAR) this.removeEvent(e as TEvents);
  }

  private defaultPieceAnimation(delta: number) {
    const animation = this.getAnimation();
    for (let i = 0; i < animation.length; i++) {
      const anim = animation[i];

      const distance = Math.hypot(
        anim.to.x - anim.from.x,
        anim.to.y - anim.from.y
      );
      const duration = Math.min(
        400,
        Math.max(
          150,
          this.boardRuntime.getAnimationDuration() + distance * 0.08
        )
      );
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

      const progress = Math.max(
        0,
        Math.min((delta - anim.start) / duration, 1)
      );
      const piece_ = anim.piece;
      const eased = easeOutCubic(progress);

      const coords = this.getClearCoords(anim.id);
      coords && this.addClearQueue(coords);

      piece_.x = anim.from.x + (anim.to.x - anim.from.x) * eased;
      piece_.y = anim.from.y + (anim.to.y - anim.from.y) * eased;

      if (eased < 1) {
        this.addPiece?.(anim.id, piece_);
        this.addToRender(anim.id);
      } else {
        piece_.anim = false;
        this.toggleCanvas.push(anim.id);
      }
    }
  }

  update(delta: number) {
    if (this.boardRuntime.getDefaultAnimation())
      this.defaultPieceAnimation(delta);
  }

  async draw() {
    const piecesImage = this.boardRuntime.getPieceStyle(),
      toRender = this.getToRender(),
      pieceHoverRef = this.boardRuntime.getPieceHover(),
      squareSize = Math.ceil(this.boardRuntime.getSize() / 8),
      selected = this.boardRuntime.getSelected(),
      ctx = this.ctx,
      layerManager = this.boardRuntime.renderer.getLayerManager();

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
      if (id === pieceHoverRef && !piece.anim) continue;
      ctx.save();
      const image = piecesImage && piecesImage[piece.type];

      if (selected?.isPending && selected.id === id) ctx.globalAlpha = 0.5;
      if (image instanceof HTMLImageElement)
        this.DrawHTMLPiece(
          image,
          ctx,
          piece,
          squareSize,
          selected?.isPending && selected.id === id ? true : false
        );
      else if (typeof image === "string")
        this.DrawTextPiece(
          image,
          ctx,
          piece,
          squareSize,
          selected?.isPending && selected.id === id ? true : false
        );
      ctx.restore();

      if (selected?.isDragging && selected.id === id)
        layerManager.applyDrawResult(ctx, "dynamicPieces", "onPointerDrag", id);
      else layerManager.applyDrawResult(ctx, "dynamicPieces", undefined, id);
    }

    for (const pieceId of this.toggleCanvas) {
      layerManager.clearDelayedPiece(pieceId, "staticPieces");
      await this.boardRuntime.renderer
        .getLayerManager()
        .togglePieceLayer("dynamicPieces", "staticPieces", pieceId, true);
    }

    if (this.toggleCanvas.length > 0)
      await this.boardRuntime.renderer.render({
        board: false,
        staticPieces: true,
        overlay: true,
        underlay: true,
        dynamicPieces: true,
      });
    this.toggleCanvas.length = 0;
  }

  postRender(): void {
    if (this.animation.length > 0) this.updateAnimation();
  }

  private DrawHTMLPiece(
    image: HTMLImageElement,
    ctx: CanvasRenderingContext2D,
    piece: TPieceInternalRef,
    squareSize: number,
    isPending: boolean
  ) {
    const x = isPending
      ? piece.x
      : piece.x - (squareSize * (this.scale - 1)) / 2;
    const y = isPending
      ? piece.y
      : piece.y - (squareSize * (this.scale - 1)) / 2;
    const w = isPending ? squareSize : squareSize * this.scale;
    if (image && image.complete && image.naturalWidth > 0) {
      ctx.drawImage(image, x, y, w, w);
    }
  }

  private DrawTextPiece(
    image: string,
    ctx: CanvasRenderingContext2D,
    piece: TPieceInternalRef,
    squareSize: number,
    isPending: boolean
  ) {
    const image_ = image.length > 1 ? image[0] : image;
    ctx.save();
    ctx.fillStyle = piece.type[0] === "w" ? "#ffffffff" : "#000";
    ctx.font = isPending
      ? `${squareSize * 0.7}px monospace`
      : `${squareSize * 0.8 * this.scale}px monospace`;
    let fontSize = isPending ? squareSize * 0.7 : squareSize * 0.8;
    ctx.font = `${fontSize}px monospace`;
    const textWidth = ctx.measureText(image_).width;
    if (textWidth > squareSize * 0.9) {
      fontSize *= (squareSize * 0.9) / textWidth;
      ctx.font = `${fontSize}px monospace`;
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(image_, piece.x + squareSize / 2, piece.y + squareSize / 2);
    ctx.restore();
  }
}

export default DynamicPiecesLayer;
