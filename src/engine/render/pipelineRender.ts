import { TPipelineRender } from "types";
import BoardRuntime from "../boardRuntime/boardRuntime";

class PipelineRender {
  private eventsNext: Record<
    TPipelineRender,
    {
      args: any[][];
      token: number;
      resolve?: (value: void | PromiseLike<void>) => void;
    }[]
  > = {
    onPointerSelect: [],
    onPointerHover: [],
    onPointerDragStart: [],
    onPointerDrag: [],
    onPointerDrop: [],
    onAnimationFrame: [],
    onDrawPiece: [],
    onDrawBoard: [],
    onDrawOverlay: [],
    onDrawUnderlay: [],
    onToggleCanvas: [],
    onRender: [],
  };

  private eventsToken: Record<TPipelineRender, number> = {
    onPointerSelect: 0,
    onPointerHover: 0,
    onPointerDragStart: 0,
    onPointerDrag: 0,
    onPointerDrop: 0,
    onAnimationFrame: 0,
    onDrawPiece: 0,
    onDrawBoard: 0,
    onDrawOverlay: 0,
    onDrawUnderlay: 0,
    onToggleCanvas: 0,
    onRender: 0,
  };

  private loading = false;
  private destroyed = false;
  private stream: TPipelineRender[] = [];

  constructor(protected boardRuntime: BoardRuntime) {}

  destroy() {
    for (const key of Object.getOwnPropertyNames(this)) {
      (this as any)[key] = null;
    }
    this.destroyed = true;
  }

  setNextEvent(
    event: TPipelineRender,
    next: any,
    resolve?: (value: void | PromiseLike<void>) => void
  ) {
    const token = ++this.eventsToken[event];
    this.eventsNext[event].push({ args: [...next], token, resolve });

    this.stream.push(event);
    if (!this.loading) this.loadEvents();
  }

  getNextEvent(event: TPipelineRender) {
    return this.eventsNext[event].shift();
  }

  async loadEvents() {
    if (this.loading || this.destroyed) return;
    this.loading = true;
    try {
      while (!this.destroyed && this.stream.length > 0) {
        const event = this.stream.shift()!;

        const next = this.getNextEvent(event);
        if (!next) continue;

        const { args, token, resolve } = next;
        if (token !== this.eventsToken[event]) {
          resolve?.();
          this.stream.unshift(event);
          continue;
        }

        const method = this.boardRuntime.eventsRuntime[event];
        if (!method || !args) continue;
        await method(...args);
        resolve?.();
      }
    } finally {
      if (this.destroyed) return;
      if (this.stream.length) this.loadEvents();
      else this.loading = false;
    }
  }
}

export default PipelineRender;
