import { TBoardEventContext } from "../types/events";

function defaultOnPieceDraw<T extends TBoardEventContext = TBoardEventContext>(
  args: T
) {
  const { ctx, piecesImage, internalRef, pieceHoverRef, squareSize } = args;
  if (!internalRef || internalRef?.current === null) return;

  for (const [id, piece] of Object.entries(internalRef.current)) {
    if (piecesImage && id !== pieceHoverRef?.current) {
      const image = piecesImage[piece.type];
      if (image && image.complete && image.naturalWidth > 0) {
        ctx.drawImage(image, piece.x, piece.y, squareSize, squareSize);
      }
    }
  }
}

export default defaultOnPieceDraw;
