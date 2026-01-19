import { TPieceId } from "../../types/piece";
import { TSelected } from "../../types/board";
import Utils from "../../utils/utils";
import BoardRuntime from "../boardRuntime/boardRuntime";
import { TCanvasLayer } from "types";

class PointerEventsHelpers {
  private triggerUp = true;
  private pointerSession = 0;
  private activeSession: null | number = null;

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

    this.boardRuntime.renderer.pipelineRender.setNextEvent("onPointerHover", [
      null,
    ]);

    const square = Utils.coordsToSquare(
      offsetX,
      offsetY,
      squareSize,
      isBlackView,
    );

    if (selected && square?.notation === selected.square?.notation) {
      return { from: null, to: null, piece: null };
    } else if (!selected || !square || !piece) {
      return { from: null, to: null, piece: null };
    }
    const piece_ = selected.square
      ? this.boardRuntime.getBoard()[selected.square.notation]
      : null;
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
      this.boardRuntime.getIsMoving() ||
      e.pressure > 0
    ) {
      return;
    }

    const searchPiece = this.boardRuntime.helpers.pieceHelper.getPieceAt(
      offsetX,
      offsetY,
      squareSize,
      this.boardRuntime.getIsBlackView(),
      this.boardRuntime.getInternalRefObj(),
    );
    if (searchPiece)
      this.boardRuntime.getCanvasLayers().setCanvasStyle("staticPieces", {
        cursor: "grab",
      });

    if (selected && searchPiece?.id === selected?.id) {
      if (this.boardRuntime.getPieceHover() !== null)
        this.boardRuntime.renderer.pipelineRender.setNextEvent(
          "onPointerHover",
          [null],
        );
      return;
    }

    if (!searchPiece) {
      this.boardRuntime.getPieceHover() &&
        this.boardRuntime.renderer.pipelineRender.setNextEvent(
          "onPointerHover",
          [null],
        );
      this.boardRuntime.getCanvasLayers().setCanvasStyle("staticPieces", {
        cursor: "default",
      });
      return;
    }

    this.boardRuntime.renderer.pipelineRender.setNextEvent("onPointerHover", [
      searchPiece.id,
    ]);
  }

  handleGrab(e: React.PointerEvent<HTMLCanvasElement>) {
    const { offsetX, offsetY } = Utils.getCanvasCoords(e);
    const squareSize = this.boardRuntime.getSize() / 8;
    const selected = this.boardRuntime.getSelected();
    const session = this.activeSession;
    if (
      session === null ||
      session !== this.pointerSession ||
      selected === null ||
      selected.startX === null ||
      selected?.startY === null ||
      e.pressure <= 0 ||
      this.boardRuntime.getIsMoving()
    ) {
      return;
    }

    const dx = offsetX - selected.startX;
    const dy = offsetY - selected.startY;

    if (Math.sqrt(dx * dx + dy * dy) > 3 /*&& !promotionRef.current.isProm*/) {
      if (selected.id) {
        const piece = this.boardRuntime.getInternalRefVal(selected.id);
        const half = squareSize / 2;
        if (piece && !selected.isDragging) {
          selected.isDragging = true;
          piece.x = offsetX - half;
          piece.y = offsetY - half;
          this.boardRuntime.renderer
            .getLayerManager()
            .addDraw("onPointerDragStart");

          this.boardRuntime.getPieceHover() &&
            this.boardRuntime.renderer.pipelineRender.setNextEvent(
              "onPointerHover",
              [null],
            );
          this.boardRuntime.renderer.pipelineRender.setNextEvent(
            "onToggleCanvas",
            ["staticPieces", "dynamicPieces", selected.id],
          );

          return;
        }

        const clampX = offsetX - half;
        const clampY = offsetY - half;

        piece.x = Math.max(
          0,
          Math.min(clampX, this.boardRuntime.getSize() - squareSize),
        );
        piece.y = Math.max(
          0,
          Math.min(clampY, this.boardRuntime.getSize() - squareSize),
        );
        this.boardRuntime.renderer.getLayerManager().addDraw("onPointerDrag");
        this.boardRuntime.renderer.pipelineRender.setNextEvent("onRender", [
          {
            board: false,
            staticPieces: true,
            overlay: true,
            underlay: true,
            dynamicPieces: true,
          },
        ]);
      }
    }
  }

  handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    ++this.pointerSession;
    this.activeSession = null;
    if (this.boardRuntime.getIsMoving()) return;
    const { offsetX, offsetY } = Utils.getCanvasCoords(e);
    const size = this.boardRuntime.getSize();
    const selected = this.boardRuntime.getSelected();

    if (offsetX < 0 || offsetY < 0 || offsetX >= size || offsetY >= size) {
      this.handlePointerLeave(e);
      return;
    }

    this.boardRuntime.getCanvasLayers().setCanvasStyle("staticPieces", {
      cursor: "default",
    });

    this.boardRuntime.renderer.pipelineRender.setNextEvent("onPointerHover", [
      null,
      true,
    ]);
    const isDragging = selected?.isDragging;

    if (this.triggerUp) {
      const { from, to, piece } =
        this.boardRuntime.helpers.pointerEventsHelper.detectMove(e);

      if (from !== null && from.notation !== to.notation) {
        this.boardRuntime.helpers.setNextMove({
          from: from.notation,
          to: to.notation,
          piece,
          click: false,
          offset: { x: offsetX, y: offsetY },
        });

        return;
      }
    } else this.triggerUp = true;

    isDragging && this.endDrag(offsetX, offsetY, false, true);
    if (selected?.secondClick || isDragging) {
      this.boardRuntime.helpers.toggleSelected(false);
    } else this.boardRuntime.helpers.toggleSelected(true);

    this.boardRuntime.renderer.pipelineRender.setNextEvent("onRender", [
      {
        board: false,
        staticPieces: true,
        overlay: true,
        underlay: true,
        dynamicPieces: true,
      },
    ]);
  }

  handlePointerLeave(e: React.PointerEvent<HTMLCanvasElement>) {
    const selected = this.boardRuntime.getSelected();
    const secondClick = selected && selected.secondClick ? false : true;
    this.endDrag(-1, -1, false, true);
    this.boardRuntime.helpers.toggleSelected(secondClick);

    this.boardRuntime.getCanvasLayers().setCanvasStyle("staticPieces", {
      cursor: "default",
    });
    this.boardRuntime.renderer.pipelineRender.setNextEvent("onPointerHover", [
      null,
      true,
    ]);
    this.boardRuntime.renderer.pipelineRender.setNextEvent("onRender", [
      {
        board: false,
        staticPieces: true,
        overlay: true,
        underlay: true,
        dynamicPieces: true,
      },
    ]);
  }

  startPress(e: React.PointerEvent<HTMLCanvasElement>) {
    const { offsetX, offsetY } = Utils.getCanvasCoords(e);
    const squareSize = this.boardRuntime.getSize() / 8;
    const selected = this.boardRuntime.getSelected();

    if (offsetX === null || offsetY === null) return;
    this.activeSession = this.pointerSession;
    const square = Utils.coordsToSquare(
      offsetX,
      offsetY,
      squareSize,
      this.boardRuntime.getIsBlackView(),
    );
    if (!square) return;
    if (selected?.isDragging) return;
    const piece_ = this.boardRuntime.helpers.pieceHelper.getPieceAt(
      offsetX,
      offsetY,
      squareSize,
      this.boardRuntime.getIsBlackView(),
      this.boardRuntime.getInternalRefObj(),
    );
    if (piece_) {
      if (selected) {
        if (square.notation !== selected.square?.notation) {
          this.triggerUp = false;
          this.moveOnClick(e, selected, { x: offsetX, y: offsetY });
        } else {
          selected.startX = offsetX;
          selected.startY = offsetY;
          selected.secondClick = true;
        }
      } else {
        this.boardRuntime.renderer.pipelineRender.setNextEvent(
          "onPointerSelect",
          [
            {
              id: piece_.id,
              x: piece_.piece.x,
              y: piece_.piece.y,
              square: piece_.piece.square,
              isDragging: false,
              isPending: false,
              startX: offsetX,
              startY: offsetY,
              secondClick: false,
            },
          ],
        );
      }
    } else if (selected) {
      this.triggerUp = false;
      this.moveOnClick(e, selected, { x: offsetX, y: offsetY });
    }
  }

  moveOnClick(
    e: React.PointerEvent<HTMLCanvasElement>,
    selected: TSelected | null,
    offset: { x: number; y: number },
  ) {
    if (selected) {
      const { from, to, piece } =
        this.boardRuntime.helpers.pointerEventsHelper.detectMove(e);
      if (from !== null) {
        this.boardRuntime.helpers.setNextMove({
          from: from.notation,
          to: to.notation,
          piece,
          click: true,
          offset,
        });
      }
    }
  }

  toggleLayer(from: TCanvasLayer, to: TCanvasLayer) {
    const selected = this.boardRuntime.getSelected();
    const piece =
      selected && this.boardRuntime.getInternalRefVal(selected.id as TPieceId);

    if (selected && selected.isDragging && piece) {
      piece.x = selected.x;
      piece.y = selected.y;
      piece.square = structuredClone(selected.square);
      this.boardRuntime.renderer.pipelineRender.setNextEvent("onToggleCanvas", [
        from,
        to,
        selected.id,
        true,
      ]);
    }
  }

  endDrag(offsetX: number, offsetY: number, move: boolean, toggle: boolean) {
    const selected = this.boardRuntime.getSelected();
    const squareSize = this.boardRuntime.getSize() / 8,
      isBlackView = this.boardRuntime.getIsBlackView();
    const piece = selected && this.boardRuntime.getInternalRefVal(selected.id);
    const sqr = Utils.coordsToSquare(offsetX, offsetY, squareSize, isBlackView);
    const coords = Utils.squareToCoords(sqr, squareSize, isBlackView);

    if (!selected || !selected.isDragging || !piece) return;

    if (!move) {
      piece.square = structuredClone(selected.square);
      piece.x = selected.x;
      piece.y = selected.y;
    } else if (sqr && coords) {
      const { x, y } = coords;
      piece.square = structuredClone(sqr);
      piece.x = x;
      piece.y = y;
    }

    toggle && this.toggleLayer("dynamicPieces", "staticPieces");
    selected.isDragging = false;
    return;
  }
}

export default PointerEventsHelpers;
