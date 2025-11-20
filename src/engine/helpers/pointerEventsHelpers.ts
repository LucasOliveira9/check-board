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

  detectMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const { offsetX, offsetY } = Utils.getCanvasCoords(e);
    const selected = this.boardRuntime.getSelected();
    const squareSize = this.boardRuntime.getSize() / 8,
      isBlackView = this.boardRuntime.getIsBlackView();
    const piece = selected && this.boardRuntime.getInternalRefVal(selected.id);

    const sqr = Utils.coordsToSquare(offsetX, offsetY, squareSize, isBlackView);
    const coords = Utils.squareToCoords(sqr, squareSize, isBlackView);
    if (selected && selected.isDragging) {
      if (Utils.isRenderer2D(this.boardRuntime.renderer) && piece) {
        this.boardRuntime.renderer.clearRect(
          { x: piece.x, y: piece.y, w: squareSize, h: squareSize },
          "dynamicPieces"
        );
      }
      if (piece && sqr && coords) {
        const { x, y } = coords;
        piece.square = sqr;
        piece.x = x;
        piece.y = y;
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

  handlePieceHover(e: React.PointerEvent<HTMLCanvasElement>) {
    const { offsetX, offsetY } = Utils.getCanvasCoords(e);
    const selected = this.boardRuntime.getSelected();
    const squareSize = this.boardRuntime.getSize() / 8;

    if (
      (selected && selected?.isDragging) ||
      (selected && this.boardRuntime.getIsMoving())
    ) {
      Utils.isRenderer2D(this.boardRuntime.renderer) &&
        this.boardRuntime.setPieceHover(null);
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
      const toRender = this.boardRuntime.getPieceHover();

      if (toRender) {
        this.boardRuntime.renderer.addStaticPiece(
          toRender,
          this.boardRuntime.getInternalRefVal(toRender)
        );
        this.boardRuntime.renderer.deleteDynamicPiece(toRender);
      }
      this.boardRuntime.setPieceHover(null);
      this.boardRuntime.getCanvasLayers().setCanvasStyle("staticPieces", {
        cursor: "default",
      });
      return;
    }
    const currHover = this.boardRuntime.getPieceHover();

    if (currHover === searchPiece.id) return;
    else if (currHover) {
      this.boardRuntime.renderer.addStaticPiece(
        currHover,
        this.boardRuntime.getInternalRefVal(currHover)
      );
      this.boardRuntime.renderer.deleteDynamicPiece(currHover);
    }
    this.boardRuntime.renderer.addDynamicPiece(
      searchPiece.id,
      this.boardRuntime.getInternalRefVal(searchPiece.id)
    );
    this.boardRuntime.renderer.deleteStaticPiece(searchPiece.id);

    this.boardRuntime.setPieceHover(searchPiece.id);
    this.boardRuntime.getCanvasLayers().setCanvasStyle("staticPieces", {
      cursor: "grab",
    });
  }

  handleGrab(e: React.PointerEvent<HTMLCanvasElement>) {
    const { offsetX, offsetY } = Utils.getCanvasCoords(e);
    const squareSize = this.boardRuntime.getSize() / 8;
    const selected = this.boardRuntime.getSelected();
    if (
      selected === null ||
      selected.startX === null ||
      selected?.startY === null
    )
      return;

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
          this.boardRuntime.renderer.deleteStaticPiece(selected.id);
          this.boardRuntime.renderer.addDynamicPiece(selected.id, piece);
          piece.x = offsetX - half;
          piece.y = offsetY - half;
          this.boardRuntime.setPieceHover(null);
          return;
        }

        if (Utils.isRenderer2D(this.boardRuntime.renderer)) {
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

  handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    const { from, to, piece } =
      this.boardRuntime.helpers.pointerEventsHelper.detectMove(e);
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
        this.boardRuntime.renderer.addStaticPiece(
          id,
          this.boardRuntime.getInternalRefVal(id)
        );
        this.boardRuntime.renderer.deleteDynamicPiece(id);
      }
    }
    this.boardRuntime.setPieceHover(null);
  }

  handlePointerLeave() {
    const selected = this.boardRuntime.getSelected();
    const isDragging = selected?.isDragging;
    const toRender = this.boardRuntime.getPieceHover() || isDragging;
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
    isDragging && this.boardRuntime.renderPieces();
  }

  handleClick(e: React.PointerEvent<HTMLCanvasElement>) {
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
      const move = this.moveOnClick(e, selected);
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
    } else this.moveOnClick(e, selected);
  }

  moveOnClick(
    e: React.PointerEvent<HTMLCanvasElement>,
    selected: TSelected | null
  ) {
    if (selected) {
      const { from, to, piece } =
        this.boardRuntime.helpers.pointerEventsHelper.detectMove(e);
      if (from !== null) {
        const move = this.boardRuntime.helpers.move(
          from.notation,
          to.notation,
          piece
        );
        if (move) return true;
      }
    }
    return false;
  }
}

export default PointerEventsHelpers;
