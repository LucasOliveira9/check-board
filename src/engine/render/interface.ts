import LayerManager from "engine/layers/layerManager";
import { TCanvasLayer } from "../../types/draw";
import { TPipelineRender } from "../../types/board";
import PipelineRender from "./pipelineRender";

interface IRenderer {
  pipelineRender: PipelineRender;
  eventsRuntime: Record<TPipelineRender, Function | null>;
  render(init: Record<TCanvasLayer, boolean>): Promise<void>;
  getLayerManager(): LayerManager;
  destroy(): void;
}

export { IRenderer };
