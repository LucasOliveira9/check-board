import { TPieceInternalRef } from "src/types/piece.ts";
import { TBoardEventContext } from "../types/events.ts";

const scale = 1.02;
const drawOnHoverFunctions = {
  HTMLImageElement: (
    image: HTMLImageElement,
    ctx: CanvasRenderingContext2D,
    piece: TPieceInternalRef,
    squareSize: number
  ) => {
    if (image && image.complete && image.naturalWidth > 0) {
      ctx.drawImage(
        image,
        piece.x - (squareSize * (scale - 1)) / 2,
        piece.y - (squareSize * (scale - 1)) / 2,
        squareSize * scale,
        squareSize * scale
      );
    }
  },
  string: (
    image: string,
    ctx: CanvasRenderingContext2D,
    piece: TPieceInternalRef,
    squareSize: number
  ) => {
    const image_ = image.length > 1 ? image[0] : image;
    ctx.save();
    ctx.fillStyle = piece.type[0] === "w" ? "#ffffffff" : "#000";
    ctx.font = `${squareSize * 0.7 * scale}px monospace`;
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
    ctx.restore();
  },
  path2D: (
    image: Path2D,
    ctx: CanvasRenderingContext2D,
    piece: TPieceInternalRef,
    squareSize: number
  ) => {
    ctx.save();
    ctx.translate(piece.x + squareSize / 2, piece.y + squareSize / 2);
    ctx.scale((squareSize * scale) / 100, (squareSize * scale) / 100);
    ctx.fillStyle = piece.type.startsWith("w") ? "#fff" : "#000";
    ctx.fill(image);
    ctx.restore();
  },
};

function defaultOnHover<T extends TBoardEventContext = TBoardEventContext>(
  args: T
) {
  const { ctx, squareSize, piece, piecesImage } = args;
  if (!piece) return;
  const image = piecesImage?.[piece.type];

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;
  if (image instanceof HTMLImageElement)
    drawOnHoverFunctions.HTMLImageElement(image, ctx, piece, squareSize);
  else if (image instanceof Path2D)
    drawOnHoverFunctions.path2D(image, ctx, piece, squareSize);
  else if (typeof image === "string")
    drawOnHoverFunctions.string(image, ctx, piece, squareSize);
  ctx.restore();

  if ("clearCache" in args && typeof args["clearCache"] === "function")
    (args as any).clearCache();
}

export default defaultOnHover;
