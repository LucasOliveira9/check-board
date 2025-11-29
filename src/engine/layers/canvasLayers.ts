import Utils from "../../utils/utils";
import { TCanvasLayer, TDrawRegion, TSafeCtx } from "../../types/draw";

class CanvasLayers {
  private staticPiecesCanvas: React.RefObject<HTMLCanvasElement | null>;
  private boardCanvas: React.RefObject<HTMLCanvasElement | null>;
  private overlayCanvas: React.RefObject<HTMLCanvasElement | null>;
  private underlayCanvas: React.RefObject<HTMLCanvasElement | null>;
  private dynamicPiecesCanvas: React.RefObject<HTMLCanvasElement | null>;

  private staticPiecesCtx:
    | (CanvasRenderingContext2D & {
        __drawRegions: TDrawRegion[];
        __clearRegions: () => void;
      })
    | null = null;
  private boardCtx:
    | (CanvasRenderingContext2D & {
        __drawRegions: TDrawRegion[];
        __clearRegions: () => void;
      })
    | null = null;
  private overlayCtx:
    | (CanvasRenderingContext2D & {
        __drawRegions: TDrawRegion[];
        __clearRegions: () => void;
      })
    | null = null;
  private underlayCtx:
    | (CanvasRenderingContext2D & {
        __drawRegions: TDrawRegion[];
        __clearRegions: () => void;
      })
    | null = null;
  private dynamicPiecesCtx:
    | (CanvasRenderingContext2D & {
        __drawRegions: TDrawRegion[];
        __clearRegions: () => void;
      })
    | null = null;

  private clientStaticPiecesCtx: TSafeCtx | null = null;
  private clientBoardCtx: TSafeCtx | null = null;
  private clientOverlayCtx: TSafeCtx | null = null;
  private clientUnderlayCtx: TSafeCtx | null = null;
  private clientDynamicPiecesCtx: TSafeCtx | null = null;

  private clientCtxMap = {
    staticPieces: this.clientStaticPiecesCtx,
    board: this.clientBoardCtx,
    overlay: this.clientOverlayCtx,
    underlay: this.clientUnderlayCtx,
    dynamicPieces: this.clientDynamicPiecesCtx,
  };

  private overlayOffscreen!: OffscreenCanvas;
  private underlayOffscreen!: OffscreenCanvas;
  private dynamicPiecesOffscreen!: OffscreenCanvas;

  private overlayOffscreenCtx: OffscreenCanvasRenderingContext2D | null = null;
  private underlayOffscreenCtx: OffscreenCanvasRenderingContext2D | null = null;
  private dynamicPiecesOffscreenCtx: OffscreenCanvasRenderingContext2D | null =
    null;
  private size: number;
  private dpr: number = 1;

  constructor(
    board: React.RefObject<HTMLCanvasElement | null>,
    pieces: React.RefObject<HTMLCanvasElement | null>,
    overlay: React.RefObject<HTMLCanvasElement | null>,
    underlayCanvas: React.RefObject<HTMLCanvasElement | null>,
    dynamicPiecesCanvas: React.RefObject<HTMLCanvasElement | null>,
    size: number
  ) {
    this.staticPiecesCanvas = pieces;
    this.boardCanvas = board;
    this.overlayCanvas = overlay;
    this.underlayCanvas = underlayCanvas;
    this.dynamicPiecesCanvas = dynamicPiecesCanvas;
    this.size = size;
    this.setContext();
    this.setQuality();
  }

  destroy() {
    this.clearCanvas();
    for (const key of Object.getOwnPropertyNames(this)) {
      (this as any)[key] = null;
    }
  }

  getContext(canvas: TCanvasLayer) {
    if (this[`${canvas}Ctx`] === null && this[`${canvas}Canvas`].current)
      this.setContext();
    return this[`${canvas}Ctx`];
  }

  getClientContext(canvas: TCanvasLayer) {
    return this.clientCtxMap[canvas];
  }

  getCanvas(canvas: TCanvasLayer) {
    return this[`${canvas}Canvas`];
  }

  keepQuality(canvas: TCanvasLayer, size: number) {
    const curr = this[`${canvas}Canvas`].current;
    if (!curr) return;

    const dpr = window.devicePixelRatio || 1;
    this.dpr = dpr;

    const targetW = size * dpr;
    const targetH = size * dpr;

    if (curr.width === targetW && curr.height === targetH) return;
    curr.width = targetW;
    curr.height = targetH;
    curr.style.width = size + "px";
    curr.style.height = size + "px";

    const ctx = this.getContext(canvas);
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    }
  }

  getDpr() {
    return this.dpr;
  }

  setCanvasStyle(canvas: TCanvasLayer, styles: Partial<CSSStyleDeclaration>) {
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
      this.underlayOffscreen = new OffscreenCanvas(this.size, this.size);
      this.dynamicPiecesOffscreen = new OffscreenCanvas(this.size, this.size);

      this.overlayOffscreenCtx = this.overlayOffscreen.getContext("2d");
      this.underlayOffscreenCtx = this.underlayOffscreen.getContext("2d");
      this.dynamicPiecesOffscreenCtx =
        this.dynamicPiecesOffscreen.getContext("2d");
    } catch {
      console.warn(
        "OffscreenCanvas not supported, using normal canvas rendering."
      );
    }
  }

  private setContext() {
    const staticPiecesCtx = this.staticPiecesCanvas.current?.getContext("2d");
    const boardCtx = this.boardCanvas.current?.getContext("2d");
    const overlayCtx = this.overlayCanvas.current?.getContext("2d");
    const underlayCtx = this.underlayCanvas.current?.getContext("2d");
    const dynamicPiecesCtx = this.dynamicPiecesCanvas.current?.getContext("2d");
    // base ctx
    this.staticPiecesCtx = staticPiecesCtx
      ? Utils.createBaseCtx(staticPiecesCtx)
      : null;
    this.boardCtx = boardCtx ? Utils.createBaseCtx(boardCtx) : null;
    this.overlayCtx = overlayCtx ? Utils.createBaseCtx(overlayCtx) : null;
    this.underlayCtx = underlayCtx ? Utils.createBaseCtx(underlayCtx) : null;
    this.dynamicPiecesCtx = dynamicPiecesCtx
      ? Utils.createBaseCtx(dynamicPiecesCtx)
      : null;
    // client ctx
    this.clientStaticPiecesCtx = this.staticPiecesCtx
      ? Utils.createSafeCtx(this.staticPiecesCtx)
      : null;
    this.clientBoardCtx = this.boardCtx
      ? Utils.createSafeCtx(this.boardCtx)
      : null;
    this.clientOverlayCtx = this.overlayCtx
      ? Utils.createSafeCtx(this.overlayCtx)
      : null;
    this.clientUnderlayCtx = this.underlayCtx
      ? Utils.createSafeCtx(this.underlayCtx)
      : null;
    this.clientDynamicPiecesCtx = this.dynamicPiecesCtx
      ? Utils.createSafeCtx(this.dynamicPiecesCtx)
      : null;

    this.clientCtxMap = {
      staticPieces: this.clientStaticPiecesCtx,
      board: this.clientBoardCtx,
      overlay: this.clientOverlayCtx,
      underlay: this.clientUnderlayCtx,
      dynamicPieces: this.clientDynamicPiecesCtx,
    };
  }

  setQuality() {
    (
      [
        "board",
        "staticPieces",
        "overlay",
        "underlay",
        "dynamicPieces",
      ] as TCanvasLayer[]
    ).forEach((key) => this.keepQuality(key, this.size));
  }

  blitOffscreenToMain() {
    const overlay = this.overlayCtx;
    const underlay = this.underlayCtx;
    const dynamic = this.dynamicPiecesCtx;

    if (overlay && this.overlayOffscreen)
      overlay.drawImage(this.overlayOffscreen, 0, 0);
    if (underlay && this.underlayOffscreen)
      underlay.drawImage(this.underlayOffscreen, 0, 0);
    if (dynamic && this.dynamicPiecesOffscreen)
      dynamic.drawImage(this.dynamicPiecesOffscreen, 0, 0);
  }

  resize(size: number) {
    this.size = size;
    [
      this.overlayOffscreen,
      this.underlayOffscreen,
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
      this.staticPiecesCtx,
      this.boardCtx,
      this.overlayCtx,
      this.underlayCtx,
      this.dynamicPiecesCtx,
    ].forEach((ctx) => ctx?.clearRect(0, 0, this.size, this.size));
  }

  clearCanvas() {
    const canvases = [
      this.boardCanvas,
      this.overlayCanvas,
      this.staticPiecesCanvas,
      this.underlayCanvas,
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
    this.staticPiecesCtx = null;
    this.underlayCtx = null;
    this.dynamicPiecesCtx = null;
  }
}

export default CanvasLayers;
