class CanvasLayers {
  private piecesCanvas: React.RefObject<HTMLCanvasElement | null>;
  private boardCanvas: React.RefObject<HTMLCanvasElement | null>;
  private overlayCanvas: React.RefObject<HTMLCanvasElement | null>;
  private piecesCtx: CanvasRenderingContext2D | null = null;
  private boardCtx: CanvasRenderingContext2D | null = null;
  private overlayCtx: CanvasRenderingContext2D | null = null;

  constructor(
    board: React.RefObject<HTMLCanvasElement | null>,
    pieces: React.RefObject<HTMLCanvasElement | null>,
    overlay: React.RefObject<HTMLCanvasElement | null>
  ) {
    this.piecesCanvas = pieces;
    this.boardCanvas = board;
    this.overlayCanvas = overlay;
    this.setContext();
  }

  destroy() {
    this.clearCanvas();
    for (const key of Object.getOwnPropertyNames(this)) {
      (this as any)[key] = null;
    }
  }

  getContext(canvas: "board" | "pieces" | "overlay") {
    if (this[`${canvas}Ctx`] === null && this[`${canvas}Canvas`].current)
      this[`${canvas}Ctx`] =
        this[`${canvas}Canvas`].current?.getContext("2d") || null;
    return this[`${canvas}Ctx`];
  }

  getCanvas(canvas: "board" | "pieces" | "overlay") {
    return this[`${canvas}Canvas`];
  }

  keepQuality(canvas: "board" | "pieces" | "overlay", size: number) {
    const curr = this[`${canvas}Canvas`].current;
    if (!curr) return;

    const dpr = window.devicePixelRatio || 1;
    curr.width = size * dpr;
    curr.height = size * dpr;
    curr.style.width = size + "px";
    curr.style.height = size + "px";

    const ctx = this.getContext(canvas);
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
  }

  setCanvasStyle(
    canvas: "board" | "pieces" | "overlay",
    styles: Partial<CSSStyleDeclaration>
  ) {
    const curr = this[`${canvas}Canvas`].current;
    if (!curr) return;
    for (const [style, value] of Object.entries(styles)) {
      if (value) (curr.style as any)[style] = value;
    }
  }

  private setContext() {
    this.piecesCtx = this.piecesCanvas.current?.getContext("2d") ?? null;
    this.boardCtx = this.boardCanvas.current?.getContext("2d") ?? null;
    this.overlayCtx = this.overlayCanvas.current?.getContext("2d") ?? null;
  }

  clearCanvas() {
    const canvases = [this.boardCanvas, this.overlayCanvas, this.piecesCanvas];
    canvases.forEach((ref) => {
      const canvas = ref.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx?.setTransform(1, 0, 0, 1, 0, 0);
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      (ref.current as any) = null;
    });

    this.boardCtx = null;
    this.overlayCtx = null;
    this.piecesCtx = null;
  }
}

export default CanvasLayers;
