import { TPipelineRender } from "types";
import BoardRuntime from "../BoardRuntime/BoardRuntime";

class PipelineRender {
  private eventsNext: Record<
    TPipelineRender,
    { args: any[][]; token: number } | null
  > = {
    onPointerSelect: null,
    onPointerHover: null,
    onPointerDragStart: null,
    onPointerDrag: null,
    onPointerDrop: null,
    onAnimationFrame: null,
    onDrawPiece: null,
    onDrawBoard: null,
    onDrawOverlay: null,
    onDrawUnderlay: null,
    onToggleCanvas: null,
    onRender: null,
  };

  private eventsResolvers: Record<
    TPipelineRender,
    ((value: void | PromiseLike<void>) => void) | null
  > = {
    onPointerSelect: null,
    onPointerHover: null,
    onPointerDragStart: null,
    onPointerDrag: null,
    onPointerDrop: null,
    onAnimationFrame: null,
    onDrawPiece: null,
    onDrawBoard: null,
    onDrawOverlay: null,
    onDrawUnderlay: null,
    onToggleCanvas: null,
    onRender: null,
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
    this.eventsNext[event] = { args: [...next], token };
    if (resolve) {
      if (this.eventsResolvers[event]) {
        this.eventsResolvers[event]!();
      }
      this.eventsResolvers[event] = resolve;
    }

    if (!this.stream.includes(event)) this.stream.push(event);
    if (!this.loading) this.loadEvents();
  }

  getNextEvent(event: TPipelineRender) {
    return this.eventsNext[event];
  }

  async loadEvents() {
    if (this.loading || this.destroyed) return;
    this.loading = true;
    try {
      while (!this.destroyed && this.stream.length > 0) {
        const event = this.stream.shift()!;

        const next = this.getNextEvent(event);
        if (!next) continue;

        const { args, token } = next;
        if (token !== this.eventsToken[event]) {
          continue;
        }

        const resolver = this.eventsResolvers[event];
        this.eventsResolvers[event] = null;

        const method = this.boardRuntime.eventsRuntime[event];
        if (!method || !args) continue;
        await method(...args);
        resolver?.();
      }
    } finally {
      if (this.destroyed) return;
      if (this.stream.length) this.loadEvents();
      else this.loading = false;
    }
  }
}

export default PipelineRender;
