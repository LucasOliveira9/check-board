import LayerManager from "engine/layers/layerManager";
import { TPieceId, TPieceInternalRef } from "../../types/piece";
import BoardRuntime from "../boardRuntime/boardRuntime";
import { IRenderer } from "./interface";
import { TCanvasLayer, TPipelineRender } from "types";
import PipelineRender from "./pipelineRender";

class Renderer3D implements IRenderer {
  constructor(protected boardRuntime: BoardRuntime) {}
  pipelineRender!: PipelineRender;
  eventsRuntime: Record<TPipelineRender, Function | null> = {} as Record<
    TPipelineRender,
    Function | null
  >;
  destroy(): void {
    for (const key of Object.getOwnPropertyNames(this)) {
      (this as any)[key] = null;
    }
  }
  getLayerManager(): LayerManager {
    throw new Error("Method not implemented.");
  }
  async render(init: Record<TCanvasLayer, boolean>): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

export default Renderer3D;
