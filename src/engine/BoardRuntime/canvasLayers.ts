class CanvasLayers {
  private piecesCanvas: React.RefObject<HTMLCanvasElement | null>;
  private boardCanvas: React.RefObject<HTMLCanvasElement | null>;
  private overlayCanvas: React.RefObject<HTMLCanvasElement | null>;
  private overlayUpCanvas: React.RefObject<HTMLCanvasElement | null>;
  private dynamicPiecesCanvas: React.RefObject<HTMLCanvasElement | null>;
  private piecesCtx: CanvasRenderingContext2D | null = null;
  private boardCtx: CanvasRenderingContext2D | null = null;
  private overlayCtx: CanvasRenderingContext2D | null = null;
  private overlayUpCtx: CanvasRenderingContext2D | null = null;
  private dynamicPiecesCtx: CanvasRenderingContext2D | null = null;

  private overlayOffscreen!: OffscreenCanvas;
  private overlayUpOffscreen!: OffscreenCanvas;
  private dynamicPiecesOffscreen!: OffscreenCanvas;

  private overlayOffscreenCtx: OffscreenCanvasRenderingContext2D | null = null;
  private overlayUpOffscreenCtx: OffscreenCanvasRenderingContext2D | null =
    null;
  private dynamicPiecesOffscreenCtx: OffscreenCanvasRenderingContext2D | null =
    null;
  private size: number;
  private dpr: number = 1;

  constructor(
    board: React.RefObject<HTMLCanvasElement | null>,
    pieces: React.RefObject<HTMLCanvasElement | null>,
    overlay: React.RefObject<HTMLCanvasElement | null>,
    overlayUpCanvas: React.RefObject<HTMLCanvasElement | null>,
    dynamicPiecesCanvas: React.RefObject<HTMLCanvasElement | null>,
    size: number
  ) {
    this.piecesCanvas = pieces;
    this.boardCanvas = board;
    this.overlayCanvas = overlay;
    this.overlayUpCanvas = overlayUpCanvas;
    this.dynamicPiecesCanvas = dynamicPiecesCanvas;
    this.size = size;
    this.setContext();
  }

  destroy() {
    this.clearCanvas();
    for (const key of Object.getOwnPropertyNames(this)) {
      (this as any)[key] = null;
    }
  }

  getContext(
    canvas: "board" | "pieces" | "overlay" | "overlayUp" | "dynamicPieces"
  ) {
    if (this[`${canvas}Ctx`] === null && this[`${canvas}Canvas`].current)
      this[`${canvas}Ctx`] =
        this[`${canvas}Canvas`].current?.getContext("2d") || null;
    return this[`${canvas}Ctx`];
  }

  getCanvas(
    canvas: "board" | "pieces" | "overlay" | "overlayUp" | "dynamicPieces"
  ) {
    return this[`${canvas}Canvas`];
  }

  keepQuality(
    canvas: "board" | "pieces" | "overlay" | "overlayUp" | "dynamicPieces",
    size: number
  ) {
    const curr = this[`${canvas}Canvas`].current;
    if (!curr) return;

    const dpr = window.devicePixelRatio || 1;
    this.dpr = dpr;

    const targetW = size * dpr;
    const targetH = size * dpr;

    if (curr.width !== targetW || curr.height !== targetH) {
      curr.width = targetW;
      curr.height = targetH;
    }

    curr.style.width = size + "px";
    curr.style.height = size + "px";

    const ctx = this.getContext(canvas);
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
  }

  getDpr() {
    return this.dpr;
  }

  setCanvasStyle(
    canvas: "board" | "pieces" | "overlay" | "overlayUp" | "dynamicPieces",
    styles: Partial<CSSStyleDeclaration>
  ) {
    const curr = this[`${canvas}Canvas`].current;
    if (!curr) return;
    for (const [style, value] of Object.entries(styles)) {
      if (value) (curr.style as any)[style] = value;
    }
  }

  setOffscreen() {
    if (typeof OffscreenCanvas === undefined) return;
    try {
      this.overlayOffscreen = new OffscreenCanvas(this.size, this.size);
      this.overlayUpOffscreen = new OffscreenCanvas(this.size, this.size);
      this.dynamicPiecesOffscreen = new OffscreenCanvas(this.size, this.size);

      this.overlayOffscreenCtx = this.overlayOffscreen.getContext("2d");
      this.overlayUpOffscreenCtx = this.overlayUpOffscreen.getContext("2d");
      this.dynamicPiecesOffscreenCtx =
        this.dynamicPiecesOffscreen.getContext("2d");
    } catch {
      console.warn(
        "OffscreenCanvas not supported, using normal canvas rendering."
      );
    }
  }

  private setContext() {
    this.piecesCtx = this.piecesCanvas.current?.getContext("2d") ?? null;
    this.boardCtx = this.boardCanvas.current?.getContext("2d") ?? null;
    this.overlayCtx = this.overlayCanvas.current?.getContext("2d") ?? null;
    this.overlayUpCtx = this.overlayUpCanvas.current?.getContext("2d") ?? null;
    this.dynamicPiecesCtx =
      this.dynamicPiecesCanvas.current?.getContext("2d") ?? null;
  }

  blitOffscreenToMain() {
    const overlay = this.overlayCtx;
    const overlayUp = this.overlayUpCtx;
    const dynamic = this.dynamicPiecesCtx;

    if (overlay && this.overlayOffscreen)
      overlay.drawImage(this.overlayOffscreen, 0, 0);
    if (overlayUp && this.overlayUpOffscreen)
      overlayUp.drawImage(this.overlayUpOffscreen, 0, 0);
    if (dynamic && this.dynamicPiecesOffscreen)
      dynamic.drawImage(this.dynamicPiecesOffscreen, 0, 0);
  }

  resize(size: number) {
    this.size = size;
    [
      this.overlayOffscreen,
      this.overlayUpOffscreen,
      this.dynamicPiecesOffscreen,
    ].forEach((c) => {
      if (c) {
        c.width = size;
        c.height = size;
      }
    });
  }

  clearAllRect() {
    [
      this.piecesCtx,
      this.boardCtx,
      this.overlayCtx,
      this.overlayUpCtx,
      this.dynamicPiecesCtx,
    ].forEach((ctx) => ctx?.clearRect(0, 0, this.size, this.size));
  }

  clearCanvas() {
    const canvases = [
      this.boardCanvas,
      this.overlayCanvas,
      this.piecesCanvas,
      this.overlayUpCanvas,
      this.dynamicPiecesCanvas,
    ];
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
    this.overlayUpCtx = null;
    this.dynamicPiecesCtx = null;
  }
}

export default CanvasLayers;
