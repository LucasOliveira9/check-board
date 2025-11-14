import { TSquare } from "src/types/square";
import Utils from "../../utils/utils";
import BoardRuntime from "./BoardRuntime";
import { TPieceId } from "src/types/piece";

class BoardEvents {
  constructor(protected boardRuntime: BoardRuntime) {
    this.boardRuntime = boardRuntime;
  }

  destroy() {
    for (const key of Object.getOwnPropertyNames(this)) {
      (this as any)[key] = null;
    }
  }

  OnPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const { offsetX, offsetY } = Utils.getCanvasCoords(e);
    const squareSize = this.boardRuntime.getSize() / 8;

    if (offsetX === null || offsetY === null || this.boardRuntime.getIsMoving())
      return;
    const square = Utils.coordsToSquare(
      offsetX,
      offsetY,
      squareSize,
      this.boardRuntime.getIsBlackView()
    );
    if (!square) return;

    const selected = this.boardRuntime.getSelected();
    if (selected?.isDragging) return;
    const piece_ = this.boardRuntime.helpers.pieceHelper.getPieceAt(
      offsetX,
      offsetY,
      squareSize,
      this.boardRuntime.getIsBlackView(),
      this.boardRuntime.getInternalRefObj()
    );
    if (piece_) {
      if (selected) {
        const { from, to, piece } = this.boardRuntime.helpers.detectMove(e);
        if (from !== null) {
          const move = this.boardRuntime.helpers.move(
            from.notation,
            to.notation,
            piece
          );
          if (move) {
            Utils.isRenderer2D(this.boardRuntime.renderer) &&
              this.boardRuntime.renderPieces();
            return;
          }
        }
      }

      this.boardRuntime.setSelected({
        id: piece_.id,
        x: piece_.piece.x,
        y: piece_.piece.y,
        square: piece_.piece.square,
        isDragging: false,
        startX: offsetX,
        startY: offsetY,
      });
    }
    this.boardRuntime.renderUnderlayAndOverlay();
  }

  onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const { offsetX, offsetY } = Utils.getCanvasCoords(e);
    const squareSize = this.boardRuntime.getSize() / 8;
    const selected = this.boardRuntime.getSelected();
    if (this.boardRuntime.getIsMoving()) return;
    if (
      (selected && !selected?.isDragging) ||
      (!selected && !this.boardRuntime.getIsMoving())
    ) {
      const searchPiece = this.boardRuntime.helpers.pieceHelper.getPieceAt(
        offsetX,
        offsetY,
        squareSize,
        this.boardRuntime.getIsBlackView(),
        this.boardRuntime.getInternalRefObj()
      );
      if (!searchPiece) {
        const toRender = this.boardRuntime.getPieceHover();

        if (toRender) {
          Utils.isRenderer2D(this.boardRuntime.renderer) &&
            this.boardRuntime.renderer.deleteDynamicPiece(toRender);
          this.boardRuntime.renderer.addStaticPiece(
            toRender,
            this.boardRuntime.getInternalRefVal(toRender)
          );
        }
        this.boardRuntime.setPieceHover(null);
        toRender && this.boardRuntime.renderPieces();
        this.boardRuntime.getCanvasLayers().setCanvasStyle("staticPieces", {
          cursor: "default",
        });
        return;
      }
      const currHover = this.boardRuntime.getPieceHover();
      if (searchPiece) {
        this.boardRuntime.setPieceHover(searchPiece.id);

        if (currHover && currHover !== searchPiece.id) {
          Utils.isRenderer2D(this.boardRuntime.renderer) &&
            this.boardRuntime.renderer.deleteDynamicPiece(currHover);
          this.boardRuntime.renderer.addStaticPiece(
            currHover,
            this.boardRuntime.getInternalRefVal(currHover)
          );
        }

        if (currHover !== searchPiece.id) {
          this.boardRuntime.renderer.deleteStaticPiece(searchPiece.id);
          this.boardRuntime.renderer.addDynamicPiece(
            searchPiece.id,
            this.boardRuntime.getInternalRefVal(searchPiece.id)
          );
          this.boardRuntime.renderPieces();
        }
        this.boardRuntime.getCanvasLayers().setCanvasStyle("staticPieces", {
          cursor: "grab",
        });
      }
    } else {
      Utils.isRenderer2D(this.boardRuntime.renderer) &&
        this.boardRuntime.renderPieces();
      this.boardRuntime.setPieceHover(null);
    }

    if (
      selected !== null &&
      selected.startX !== null &&
      selected?.startY !== null
    ) {
      const dx = offsetX - selected.startX;
      const dy = offsetY - selected.startY;
      if (
        Math.sqrt(dx * dx + dy * dy) > 3 /*&& !promotionRef.current.isProm*/
      ) {
        this.boardRuntime.setPieceHover(null);
        if (selected.id) {
          const piece = this.boardRuntime.getInternalRefVal(selected.id);
          const half = squareSize / 2;
          if (piece && !selected.isDragging) {
            this.boardRuntime.getCanvasLayers().setCanvasStyle("staticPieces", {
              cursor: "grabbing",
            });

            selected.isDragging = true;
            this.boardRuntime.renderer.deleteStaticPiece(selected.id);
            this.boardRuntime.renderer.addDynamicPiece(selected.id, piece);
            if (Utils.isRenderer2D(this.boardRuntime.renderer) && piece) {
              this.boardRuntime.renderer.clearRect(
                { x: piece.x, y: piece.y, w: squareSize, h: squareSize },
                "dynamicPieces"
              );
            }
            piece.x = offsetX - half;
            piece.y = offsetY - half;
            this.boardRuntime.renderPieces();
            return;
          }

          if (Utils.isRenderer2D(this.boardRuntime.renderer)) {
            this.boardRuntime.renderer.addToClear(
              {
                x: piece.x,
                y: piece.y,
                w: squareSize,
                h: squareSize,
              },
              "dynamicPieces"
            );
            this.boardRuntime.renderer.addPosition(
              selected.id,
              {
                x: piece.x,
                y: piece.y,
              },
              "dynamicPieces"
            );
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

          this.boardRuntime.renderPieces();
        }
      }
    }
  }

  onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (this.boardRuntime.getIsMoving()) return;
    const { from, to, piece } = this.boardRuntime.helpers.detectMove(e);
    let move = false;
    let selected = this.boardRuntime.getSelected();
    const squareSize = this.boardRuntime.getSize() / 8;

    if (from !== null) {
      move = this.boardRuntime.helpers.move(from.notation, to.notation, piece);
    }
    this.boardRuntime.getCanvasLayers().setCanvasStyle("staticPieces", {
      cursor: "default",
    });

    if (!move) {
      const id =
        selected?.isDragging && selected?.id
          ? selected.id
          : this.boardRuntime.getPieceHover();
      if (id) {
        this.boardRuntime.renderer.deleteDynamicPiece(id);
        this.boardRuntime.renderer.addStaticPiece(
          id,
          this.boardRuntime.getInternalRefVal(id)
        );
        this.boardRuntime.renderPieces();
      }

      this.boardRuntime.renderUnderlayAndOverlay();

      if (selected) {
        this.boardRuntime.setSelected({
          ...selected,
          isDragging: false,
          startX: null,
          startY: null,
        });
      }
      selected = null;
    }

    this.boardRuntime.setPieceHover(null);
  }

  onPointerLeave(e: React.PointerEvent<HTMLCanvasElement>) {
    const selected = this.boardRuntime.getSelected();
    const toRender = this.boardRuntime.getPieceHover() || selected?.isDragging;
    const squareSize = this.boardRuntime.getSize() / 8;
    selected &&
      this.boardRuntime.setSelected({
        ...selected,
        isDragging: false,
        startX: null,
        startY: null,
      });

    const piece =
      selected && this.boardRuntime.getInternalRefVal(selected.id as TPieceId);
    if (
      selected &&
      selected.isDragging &&
      piece &&
      Utils.isRenderer2D(this.boardRuntime.renderer)
    ) {
      this.boardRuntime.renderer.clearRect(
        { x: piece.x, y: piece.y, w: squareSize, h: squareSize },
        "dynamicPieces"
      );
    }
    piece && ((piece.x = selected.x), (piece.y = selected.y));

    const id = selected?.isDragging
      ? selected.id
      : this.boardRuntime.getPieceHover();
    if (toRender) {
      if (id) {
        Utils.isRenderer2D(this.boardRuntime.renderer) &&
          this.boardRuntime.renderer.deleteDynamicPiece(id);
        this.boardRuntime.renderer.addStaticPiece(
          id,
          this.boardRuntime.getInternalRefVal(id)
        );
      }
    }
    this.boardRuntime.setPieceHover(null);
    toRender && this.boardRuntime.renderPieces();
  }
}
export default BoardEvents;
