import BoardRuntime from "../BoardRuntime/BoardRuntime";
import BaseLayer from "./baseLayer";
import { TDrawRegion } from "types";
import Utils from "../../utils/utils";

class UnderlayLayer extends BaseLayer {
  constructor(boardRuntime: BoardRuntime) {
    super("underlay", boardRuntime);
  }

  update(delta: number): void {
    return;
  }

  draw(
    ctx: CanvasRenderingContext2D & {
      __drawRegions: TDrawRegion[];
      __clearRegions: () => void;
    }
  ): void {
    const isBlackView = this.boardRuntime.getIsBlackView(),
      size = this.boardRuntime.getSize(),
      piecesImage = this.boardRuntime.getPieceStyle(),
      internalRef = this.boardRuntime.getInternalRefObj(),
      selectedRef = this.boardRuntime.getSelected(),
      events = this.boardRuntime.getEvents();
    const squareSize = size / 8;

    if (
      selectedRef?.id &&
      ctx &&
      !events?.onPointerSelect &&
      this.boardRuntime.renderer.getLayerManager().getEventEnabled().selection
    ) {
      const sqr = internalRef[selectedRef.id]
        ? Utils.squareToCoords(selectedRef.square, squareSize, isBlackView)
        : null;

      if (sqr) {
        const { x, y } = sqr;
        const piece_ = this.boardRuntime.helpers.pieceHelper.getPieceAt(
          x,
          y,
          squareSize,
          isBlackView,
          internalRef
        )?.piece;

        this.boardRuntime.renderer
          .getLayerManager()
          .getIterator()
          .defaultOnSelect({
            ctx,
            x,
            y,
            size,
            squareSize,
            getPiece: piece_,
            getPiecesImage: piecesImage,
            getSquare: selectedRef.square,
          });
      }
    }
  }
}

export default UnderlayLayer;
