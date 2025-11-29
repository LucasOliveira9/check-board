import BoardRuntime from "../BoardRuntime/BoardRuntime";
import BaseLayer from "./baseLayer";
import { TDrawRegion, TPieceId, TPieceInternalRef } from "types";
import Utils from "../../utils/utils";

class DynamicPiecesLayer extends BaseLayer {
  private scale: number = 1.1;
  private toggleCanvas: TPieceId[] = [];
  constructor(boardRuntime: BoardRuntime) {
    super("dynamicPieces", boardRuntime);
  }

  update(delta: number) {
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

      const coords = this.getCoords(anim.id);
      coords && this.addClearCoords(coords);

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

  async draw(
    ctx: CanvasRenderingContext2D & {
      __drawRegions: TDrawRegion[];
      __clearRegions: () => void;
    }
  ) {
    const piecesImage = this.boardRuntime.getPieceStyle(),
      toRender = this.getToRender(),
      pieceHoverRef = this.boardRuntime.getPieceHover(),
      squareSize = this.boardRuntime.getSize() / 8,
      selected = this.boardRuntime.getSelected();

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
      if (image instanceof HTMLImageElement) {
        if (image && image.complete && image.naturalWidth > 0) {
          ctx.drawImage(
            image,
            piece.x - (squareSize * (this.scale - 1)) / 2,
            piece.y - (squareSize * (this.scale - 1)) / 2,
            squareSize * this.scale,
            squareSize * this.scale
          );
        }
      } else if (typeof image === "string") {
        const image_ = image.length > 1 ? image[0] : image;
        ctx.save();
        ctx.fillStyle = piece.type[0] === "w" ? "#ffffffff" : "#000";
        ctx.font = `${squareSize * 0.8 * this.scale}px monospace`;
        let fontSize = squareSize * 0.8;
        ctx.font = `${fontSize}px monospace`;
        const textWidth = ctx.measureText(image_).width;
        if (textWidth > squareSize * 0.9) {
          fontSize *= (squareSize * 0.9) / textWidth;
          ctx.font = `${fontSize}px monospace`;
        }
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          image_,
          piece.x + squareSize / 2,
          piece.y + squareSize / 2
        );
        ctx.restore();
      }

      ctx.restore();
      if (selected?.isDragging && selected.id === id)
        this.boardRuntime.handleDrawResult(
          ctx,
          "dynamicPieces",
          "onPointerDrag",
          id
        );
      else
        this.boardRuntime.handleDrawResult(ctx, "dynamicPieces", undefined, id);
    }

    for (const pieceId of this.toggleCanvas) {
      await this.boardRuntime.renderer
        .getLayerManager()
        .togglePieceLayer("dynamicPieces", "staticPieces", pieceId, true);
    }
    if (this.toggleCanvas.length > 0) await this.boardRuntime.renderPieces();
    this.toggleCanvas.length = 0;
    this.hover(ctx);
  }

  postRender(): void {
    this.updateAnimation();
  }

  hover(
    ctx: CanvasRenderingContext2D & {
      __drawRegions: TDrawRegion[];
      __clearRegions: () => void;
    }
  ) {
    const size = this.boardRuntime.getSize(),
      piecesImage = this.boardRuntime.getPieceStyle(),
      internalRef = this.boardRuntime.getInternalRefObj(),
      pieceHoverRef = this.boardRuntime.getPieceHover(),
      selectedRef = this.boardRuntime.getSelected(),
      events = this.boardRuntime.getEvents(),
      squareSize = size / 8,
      injection = this.boardRuntime.getInjection();

    if (
      pieceHoverRef &&
      !selectedRef?.isDragging &&
      !events?.onPointerHover &&
      this.boardRuntime.renderer.getLayerManager().getEventEnabled().hover
    ) {
      const piece = internalRef[pieceHoverRef];
      const canvas = this.boardRuntime
        .getCanvasLayers()
        .getCanvas("dynamicPieces").current
        ? this.boardRuntime.getCanvasLayers().getCanvas("dynamicPieces").current
        : undefined;
      if (piece && !piece.anim) {
        if (events?.onPointerHover) {
          const context = this.boardRuntime.getContext(true, {
            squareSize,
            x: piece.x,
            y: piece.y,
            size,
            piece: piece,
            square: piece.square,
          });

          this.boardRuntime.helpers.triggerEvent(
            events,
            "onPointerHover",
            injection ? injection(context) : context
          );
          return;
        }

        this.boardRuntime.renderer
          .getLayerManager()
          .getIterator()
          .defaultOnHover({
            ctx,
            size,
            squareSize,
            x: piece.x,
            y: piece.y,
            canvas: canvas ? canvas : undefined,
            piece: piece,
            square: piece.square,
            piecesImage: piecesImage,
          });
      }
    }
  }
}

export default DynamicPiecesLayer;
