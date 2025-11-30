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

  draw(): void {
    const isBlackView = this.boardRuntime.getIsBlackView(),
      size = this.boardRuntime.getSize(),
      piecesImage = this.boardRuntime.getPieceStyle(),
      internalRef = this.boardRuntime.getInternalRefObj(),
      selectedRef = this.boardRuntime.getSelected(),
      events = this.boardRuntime.getEvents(),
      injection = this.boardRuntime.getInjection(),
      ctx = this.ctx;
    const squareSize = size / 8;

    if (
      selectedRef?.id &&
      ctx &&
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

        if (events?.onPointerSelect) {
          const context = this.boardRuntime.getContext(true, {
            squareSize,
            x: x,
            y: y,
            size,
            piece: piece_,
            square: selectedRef.square,
          });

          this.boardRuntime.helpers.triggerEvent(
            events,
            "onPointerSelect",
            injection ? injection(context) : context
          );
          return;
        }
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
