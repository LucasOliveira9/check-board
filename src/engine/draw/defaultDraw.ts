import { TPieceId, TPieceInternalRef } from "../../types/piece";
import BoardRuntime from "../BoardRuntime/BoardRuntime";
import { TRender } from "../../types/draw";
import Utils from "../../utils/utils";

class DefaultDraw {
  private scale: number = 1.1;
  constructor(protected boardRuntime: BoardRuntime) {}

  destroy() {
    for (const key of Object.getOwnPropertyNames(this)) {
      (this as any)[key] = null;
    }
  }

  drawStaticPiece() {
    const toRender =
      Utils.isRenderer2D(this.boardRuntime.renderer) &&
      this.boardRuntime.renderer.getToRender("staticPieces");
    const ctx = this.boardRuntime.getCanvasLayers().getContext("staticPieces"),
      piecesImage = this.boardRuntime.getPieceStyle(),
      internalRefObj = this.boardRuntime.renderer.getStaticPieceObj(),
      pieceHoverRef = this.boardRuntime.getPieceHover(),
      squareSize = this.boardRuntime.getSize() / 8,
      selectedRef = this.boardRuntime.getSelected(),
      isBlackView = this.boardRuntime.getIsBlackView(),
      animation = this.boardRuntime.getAnimation();

    if (!piecesImage || !toRender) return;
    if (
      typeof piecesImage.bB !== "string" &&
      !(piecesImage.bB instanceof HTMLImageElement)
    )
      return;

    const internalRef: Record<TPieceId, TPieceInternalRef> = {} as Record<
      TPieceId,
      TPieceInternalRef
    >;

    for (const [id, piece] of Object.entries(internalRefObj)) {
      const toRender_ = toRender.get(id as TPieceId);
      if (toRender_) internalRef[id as TPieceId] = piece;
    }

    if (!internalRef || internalRef === null || !ctx) return;
    const sameSquarePiece: { piece: TPieceInternalRef; id: TPieceId }[] = [];

    for (const [id, piece] of Object.entries(internalRef)) {
      if (!piece) continue;
      if (
        !this.boardRuntime.getMove() &&
        this.boardRuntime.helpers.pieceHelper.getPieceAt(
          piece.x,
          piece.y,
          squareSize,
          isBlackView,
          internalRef
        )?.id === id
      ) {
        sameSquarePiece.push({ piece, id });
        continue;
      }
      ctx.save();
      if (piecesImage && id !== pieceHoverRef) {
        let image = piecesImage[piece.type];
        if (image instanceof HTMLImageElement)
          this.DrawHTMLPiece(image, ctx, piece, squareSize);
        else if (typeof image === "string")
          this.DrawTextPiece(image, ctx, piece, squareSize);
      }
      ctx.restore();
    }

    for (const obj of sameSquarePiece) {
      const { piece, id } = obj;
      ctx.save();
      if (piecesImage && id !== pieceHoverRef) {
        let image = piecesImage[piece.type];
        if (image instanceof HTMLImageElement)
          this.DrawHTMLPiece(image, ctx, piece, squareSize);
        else if (typeof image === "string")
          this.DrawTextPiece(image, ctx, piece, squareSize);
      }
      ctx.restore();
    }

    if (Utils.isRenderer2D(this.boardRuntime.renderer))
      this.boardRuntime.renderer.clearStaticToRender();
  }

  drawDynamicPieces(time: number) {
    const ctx = this.boardRuntime.getCanvasLayers().getContext("dynamicPieces"),
      piecesImage = this.boardRuntime.getPieceStyle(),
      internalRefObj = this.boardRuntime.renderer.getDynamicPieceObj(),
      toRender =
        Utils.isRenderer2D(this.boardRuntime.renderer) &&
        this.boardRuntime.renderer.getToRender("dynamicPieces"),
      pieceHoverRef = this.boardRuntime.getPieceHover(),
      squareSize = this.boardRuntime.getSize() / 8,
      selectedRef = this.boardRuntime.getSelected(),
      isBlackView = this.boardRuntime.getIsBlackView(),
      animation = this.boardRuntime.getAnimation();

    if (!piecesImage || !toRender || !toRender.size) return;
    if (
      typeof piecesImage.bB !== "string" &&
      !(piecesImage.bB instanceof HTMLImageElement)
    )
      return;

    const internalRef = {} as Record<TPieceId, TPieceInternalRef>;

    for (const [id, piece] of Object.entries(internalRefObj)) {
      const toRender_ = toRender.get(id as TPieceId);
      if (toRender_) internalRef[id as TPieceId] = piece;
    }

    const moveCanvas: TPieceId[] = [];
    if (!internalRef || internalRef === null || !ctx) return;

    animation.length > 0 && this.boardRuntime.setIsMoving(true);

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

      const progress = Math.max(0, Math.min((time - anim.start) / duration, 1));
      const piece_ = anim.piece;
      const eased = easeOutCubic(progress);

      piece_.x = anim.from.x + (anim.to.x - anim.from.x) * eased;
      piece_.y = anim.from.y + (anim.to.y - anim.from.y) * eased;

      if (Utils.isRenderer2D(this.boardRuntime.renderer) && eased < 1) {
        this.boardRuntime.renderer.addToClear(
          {
            x: piece_.x,
            y: piece_.y,
            w: squareSize,
            h: squareSize,
          },
          "dynamicPieces"
        );
        this.boardRuntime.renderer.addPosition(
          anim.id,
          {
            x: piece_.x,
            y: piece_.y,
          },
          "dynamicPieces"
        );
      }

      if (eased >= 1) {
        piece_.anim = false;
        moveCanvas.push(anim.id);
      }
    }
    for (const [id, piece] of Object.entries(internalRef)) {
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
    }

    for (const pieceId of moveCanvas) {
      this.boardRuntime.renderer.addStaticPiece(
        pieceId,
        structuredClone(internalRef[pieceId])
      );
      this.boardRuntime.renderer.deleteDynamicPiece(pieceId);
    }
    if (moveCanvas.length > 0) this.boardRuntime.renderPieces();
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
    (ctx as any) = null;
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

    (ctx as any) = null;
  }
}

export default DefaultDraw;
