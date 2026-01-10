import Utils from "../../utils/utils";
import { TCanvasCoords, TCanvasLayer, TRender } from "../../types/draw";
import {
  TPieceBoard,
  TPieceCoords,
  TPieceId,
  TPieceInternalRef,
} from "../../types/piece";
import BoardRuntime from "../boardRuntime/boardRuntime";
import LayerManager from "../layers/layerManager";
import { IRenderer } from "./interface";
import { TPipelineRender } from "../../types/board";
import PipelineRender from "./pipelineRender";

class Renderer2D implements IRenderer {
  private layerManager: LayerManager;
  eventsRuntime: Record<TPipelineRender, Function | null>;
  pipelineRender: PipelineRender;

  constructor(protected boardRuntime: BoardRuntime) {
    this.layerManager = new LayerManager(boardRuntime);
    this.eventsRuntime = {
      onPointerSelect: this.boardRuntime.setSelected.bind(this.boardRuntime),
      onPointerHover: this.boardRuntime.setPieceHover.bind(this.boardRuntime),
      onPointerDragStart: null,
      onPointerDrag: null,
      onPointerDrop: null,
      onAnimationFrame: null,
      onDrawPiece: null,
      onDrawBoard: null,
      onDrawOverlay: null,
      onDrawUnderlay: null,
      onToggleCanvas: this.toggleCanvas.bind(this),
      onRender: this.render.bind(this),
    };
    this.pipelineRender = new PipelineRender(boardRuntime);
  }

  destroy(): void {
    this.pipelineRender.destroy();

    for (const key of Object.getOwnPropertyNames(this)) {
      (this as any)[key] = null;
    }
  }

  async render(canvases: Record<TCanvasLayer, boolean>) {
    this.layerManager.renderEvents(true);
    for (const [canvas, toRender] of Object.entries(canvases))
      if (toRender)
        await this.layerManager.getLayer(canvas as TCanvasLayer).renderAsync();
    this.layerManager.renderEvents(false);
  }

  getLayerManager(): LayerManager {
    return this.layerManager;
  }

  async toggleCanvas(
    from: TCanvasLayer,
    to: TCanvasLayer,
    pieceId: TPieceId,
    noRender?: boolean
  ) {
    await this.layerManager.togglePieceLayer(from, to, pieceId, noRender);
  }
}

export default Renderer2D;
