import { TBoardEventContext } from "src/types/events";
import { TPiece, TPieceId, TPieceInternalRef } from "../../types/piece";
import { squareToCoords } from "../../utils/coords";
import BoardRuntime from "../BoardRuntime/BoardRuntime";

class DefaultDraw {
  private scale: number = 1.1;
  constructor(protected boardRuntime: BoardRuntime) {}

  destroy() {
    for (const key of Object.getOwnPropertyNames(this)) {
      (this as any)[key] = null;
    }
  }

  drawPiece(time: number) {
    const ctx = this.boardRuntime.getCanvasLayers().getContext("pieces"),
      piecesImage = this.boardRuntime.getPieceStyle(),
      internalRef = this.boardRuntime.getInternalRefObj(),
      pieceHoverRef = this.boardRuntime.getPieceHover(),
      squareSize = this.boardRuntime.getSize() / 8,
      selectedRef = this.boardRuntime.getSelected(),
      isBlackView = this.boardRuntime.getIsBlackView(),
      animation = this.boardRuntime.getAnimation();

    if (!piecesImage) return;
    if (
      typeof piecesImage !== "string" &&
      !(piecesImage.bB instanceof HTMLImageElement)
    )
      return;

    if (!internalRef || internalRef === null || !ctx) return;
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

      if (eased >= 1) piece_.anim = false;
    }

    const pieceToAnimate: TPieceInternalRef[] = [];
    const sameSquarePiece: { piece: TPieceInternalRef; id: TPieceId }[] = [];

    for (const [id, piece] of Object.entries(internalRef)) {
      if (selectedRef && selectedRef.isDragging && id === selectedRef.id) {
        pieceToAnimate.push(piece);
        continue;
      }
      if (piece.anim) {
        pieceToAnimate.push(piece);
        continue;
      }

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

    for (const piece of pieceToAnimate) {
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

    (ctx as any) = null;
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
