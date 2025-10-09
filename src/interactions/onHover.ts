import { TBoardEventContext } from "src/types/events";

const defaultOnHover = (args: TBoardEventContext) => {
  const { ctx, squareSize, piece, piecesImage } = args;
  if (!piece) return;
  const img = piecesImage?.[piece.type];
  const scale = 1.02;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = 6;
  ctx.shadowOffsetY = 6;
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(
      img,
      piece.x - (squareSize * (scale - 1)) / 2,
      piece.y - (squareSize * (scale - 1)) / 2,
      squareSize * scale,
      squareSize * scale
    );
  }
  ctx.restore();
};

export default defaultOnHover;
