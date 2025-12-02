import { TPieceId } from "../../types/piece";
import { TSelected } from "../../types/board";
import Utils from "../../utils/utils";
import BoardRuntime from "../BoardRuntime/BoardRuntime";

class PointerEventsHelpers {
  constructor(protected boardRuntime: BoardRuntime) {}

  destroy() {
    for (const key of Object.getOwnPropertyNames(this)) {
      (this as any)[key] = null;
    }
  }

  async detectMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const { offsetX, offsetY } = Utils.getCanvasCoords(e);
    const selected = this.boardRuntime.getSelected();
    const squareSize = this.boardRuntime.getSize() / 8,
      isBlackView = this.boardRuntime.getIsBlackView();
    const piece = selected && this.boardRuntime.getInternalRefVal(selected.id);
    const sqr = Utils.coordsToSquare(offsetX, offsetY, squareSize, isBlackView);
    const coords = Utils.squareToCoords(sqr, squareSize, isBlackView);
    await this.boardRuntime.setPieceHover(null);
    if (selected && selected.isDragging) {
      if (piece && sqr && coords) {
        const { x, y } = coords;
        piece.square = sqr;
        piece.x = x;
        piece.y = y;
      }
      if (piece) {
        await this.boardRuntime.renderer
          .getLayerManager()
          .togglePieceLayer("dynamicPieces", "staticPieces", selected.id);
      }
    }

    const square = Utils.coordsToSquare(
      offsetX,
      offsetY,
      squareSize,
      isBlackView
    );

    if (selected && square?.notation === selected.square.notation) {
      selected &&
        this.boardRuntime.setSelected({
          ...selected,
          isDragging: false,
          startX: null,
          startY: null,
        });

      return { from: null, to: null, piece: null };
    } else if (!selected || !square || !piece) {
      selected &&
        this.boardRuntime.setSelected({
          ...selected,
          isDragging: false,
          startX: null,
          startY: null,
        });

      return { from: null, to: null, piece: null };
    }
    const piece_ = this.boardRuntime.getBoard()[selected.square.notation];
    if (piece_) {
      return { from: selected.square, to: square, piece: piece_ };
    }
    return { from: null, to: null, piece: null };
  }

  async handlePieceHover(e: React.PointerEvent<HTMLCanvasElement>) {
    const { offsetX, offsetY } = Utils.getCanvasCoords(e);
    const selected = this.boardRuntime.getSelected();
    const squareSize = this.boardRuntime.getSize() / 8;

    if (
      (selected && selected?.isDragging) ||
      this.boardRuntime.getIsMoving() ||
      e.button !== -1
    ) {
      await this.boardRuntime.setPieceHover(null);
      return;
    }

    const searchPiece = this.boardRuntime.helpers.pieceHelper.getPieceAt(
      offsetX,
      offsetY,
      squareSize,
      this.boardRuntime.getIsBlackView(),
      this.boardRuntime.getInternalRefObj()
    );

    if (!searchPiece) {
      await this.boardRuntime.setPieceHover(null);
      this.boardRuntime.getCanvasLayers().setCanvasStyle("staticPieces", {
        cursor: "default",
      });
      return;
    }

    await this.boardRuntime.setPieceHover(searchPiece.id);
    this.boardRuntime.getCanvasLayers().setCanvasStyle("staticPieces", {
      cursor: "grab",
    });
  }

  async handleGrab(e: React.PointerEvent<HTMLCanvasElement>) {
    const { offsetX, offsetY } = Utils.getCanvasCoords(e);
    const squareSize = this.boardRuntime.getSize() / 8;
    const selected = this.boardRuntime.getSelected();
    if (
      selected === null ||
      selected.startX === null ||
      selected?.startY === null
    )
      return;
    await this.boardRuntime.setPieceHover(null);
    const dx = offsetX - selected.startX;
    const dy = offsetY - selected.startY;
    if (Math.sqrt(dx * dx + dy * dy) > 3 /*&& !promotionRef.current.isProm*/) {
      if (selected.id) {
        const piece = this.boardRuntime.getInternalRefVal(selected.id);
        const half = squareSize / 2;
        if (piece && !selected.isDragging) {
          this.boardRuntime.getCanvasLayers().setCanvasStyle("staticPieces", {
            cursor: "grabbing",
          });

          selected.isDragging = true;

          await this.boardRuntime.renderer
            .getLayerManager()
            .togglePieceLayer("staticPieces", "dynamicPieces", selected.id);

          piece.x = offsetX - half;
          piece.y = offsetY - half;
          return;
        }

        const clampX = offsetX - half;
        const clampY = offsetY - half;

        piece.x = Math.max(
          0,
          Math.min(clampX, this.boardRuntime.getSize() - squareSize)
        );
        piece.y = Math.max(
          0,
          Math.min(clampY, this.boardRuntime.getSize() - squareSize)
        );

        this.boardRuntime.renderer
          .getLayerManager()
          .getLayer("dynamicPieces")
          .addCoords(selected.id, {
            x: piece.x,
            y: piece.y,
            w: squareSize,
            h: squareSize,
          });

        await this.boardRuntime.renderer.render(false);
      }
    }
  }

  async handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    const { from, to, piece } =
      await this.boardRuntime.helpers.pointerEventsHelper.detectMove(e);
    let move = false;
    let selected = this.boardRuntime.getSelected();
    const squareSize = this.boardRuntime.getSize() / 8;

    if (from !== null) {
      move = this.boardRuntime.helpers.move(
        from.notation,
        to.notation,
        piece,
        false
      );
    }
    this.boardRuntime.getCanvasLayers().setCanvasStyle("staticPieces", {
      cursor: "default",
    });

    if (!move) {
      const id = selected?.isDragging && selected?.id ? selected.id : null;
      if (id)
        this.boardRuntime.renderer
          .getLayerManager()
          .togglePieceLayer("dynamicPieces", "staticPieces", id);
    }
    await this.boardRuntime.setPieceHover(null);
  }

  async handlePointerLeave() {
    const selected = this.boardRuntime.getSelected();

    const piece =
      selected && this.boardRuntime.getInternalRefVal(selected.id as TPieceId);
    piece && ((piece.x = selected.x), (piece.y = selected.y));
    if (selected && selected.isDragging && piece) {
      await this.boardRuntime.renderer
        .getLayerManager()
        .togglePieceLayer("dynamicPieces", "staticPieces", selected.id);
    }

    selected &&
      this.boardRuntime.setSelected({
        ...selected,
        isDragging: false,
        startX: null,
        startY: null,
      });

    await this.boardRuntime.setPieceHover(null);
  }

  async handleClick(e: React.PointerEvent<HTMLCanvasElement>) {
    const { offsetX, offsetY } = Utils.getCanvasCoords(e);
    const squareSize = this.boardRuntime.getSize() / 8;
    const selected = this.boardRuntime.getSelected();

    if (offsetX === null || offsetY === null) return;
    const square = Utils.coordsToSquare(
      offsetX,
      offsetY,
      squareSize,
      this.boardRuntime.getIsBlackView()
    );
    if (!square) return;
    if (selected?.isDragging) return;
    const piece_ = this.boardRuntime.helpers.pieceHelper.getPieceAt(
      offsetX,
      offsetY,
      squareSize,
      this.boardRuntime.getIsBlackView(),
      this.boardRuntime.getInternalRefObj()
    );
    if (piece_) {
      const move = await this.moveOnClick(e, selected);
      !move &&
        this.boardRuntime.setSelected({
          id: piece_.id,
          x: piece_.piece.x,
          y: piece_.piece.y,
          square: piece_.piece.square,
          isDragging: false,
          startX: offsetX,
          startY: offsetY,
        });
    } else await this.moveOnClick(e, selected);
  }

  async moveOnClick(
    e: React.PointerEvent<HTMLCanvasElement>,
    selected: TSelected | null
  ) {
    if (selected) {
      const { from, to, piece } =
        await this.boardRuntime.helpers.pointerEventsHelper.detectMove(e);
      if (from !== null) {
        const move = this.boardRuntime.helpers.move(
          from.notation,
          to.notation,
          piece,
          true
        );
        if (move) return true;
      }
    }
    return false;
  }
}

export default PointerEventsHelpers;
