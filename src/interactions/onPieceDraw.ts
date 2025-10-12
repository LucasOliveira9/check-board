import { TPieceInternalRef } from "src/types/piece.ts";
import { TBoardEventContext } from "../types/events.ts";

const drawFunctions = {
  HTMLImageElement: (
    image: HTMLImageElement,
    ctx: CanvasRenderingContext2D,
    piece: TPieceInternalRef,
    squareSize: number
  ) => {
    if (image && image.complete && image.naturalWidth > 0) {
      ctx.drawImage(image, piece.x, piece.y, squareSize, squareSize);
    }
  },
  string: (
    image: string,
    ctx: CanvasRenderingContext2D,
    piece: TPieceInternalRef,
    squareSize: number
  ) => {
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
  },
  path2D: (
    image: Path2D,
    ctx: CanvasRenderingContext2D,
    piece: TPieceInternalRef,
    squareSize: number
  ) => {
    ctx.save();
    ctx.translate(piece.x + squareSize / 2, piece.y + squareSize / 2);
    const scale = squareSize / 100;
    ctx.scale(scale, scale);
    ctx.fillStyle = piece.type.startsWith("w") ? "#fff" : "#000";
    ctx.fill(image);
    ctx.restore();
  },
};
function defaultOnPieceDraw<T extends TBoardEventContext = TBoardEventContext>(
  args: T
) {
  const { ctx, piecesImage, internalRef, pieceHoverRef, squareSize } = args;
  if (!internalRef || internalRef?.current === null) return;

  for (const [id, piece] of Object.entries(internalRef.current)) {
    ctx.save();
    if (piecesImage && id !== pieceHoverRef?.current) {
      const image = piecesImage[piece.type];
      if (image instanceof HTMLImageElement)
        drawFunctions.HTMLImageElement(image, ctx, piece, squareSize);
      else if (image instanceof Path2D)
        drawFunctions.path2D(image, ctx, piece, squareSize);
      else if (typeof image === "string")
        drawFunctions.string(image, ctx, piece, squareSize);
    }
  }
  ctx.restore();
}

export default defaultOnPieceDraw;
