import { TBoardRuntime, TPipelineRender, TSelected } from "../../types/board";
import {
  TAnimation,
  TBoardEventContext,
  TDrawFunction,
  TEvents,
  TMoveFlag,
} from "../../types/events";
import {
  TPiece,
  TPieceBoard,
  TPieceCoords,
  TPieceId,
  TPieceInternalRef,
} from "../../types/piece";
import BoardEvents from "./boardEvents";
import EngineHelpers from "../helpers/engineHelpers";
import { TFile, TNotation, TRank, TSquare } from "../../types/square";
import { IRenderer } from "../render/interface";
import Renderer2D from "../render/renderer2D";
import Renderer3D from "../render/renderer3D";
import Utils from "../../utils/utils";
import {
  TCanvasCoords,
  TCanvasLayer,
  TDrawRegion,
  THoverConfig,
  TRender,
} from "../../types/draw";
import { TSafeCtx } from "../../types/draw";
import PipelineRender from "../render/pipelineRender";

class BoardRuntime<T extends TBoardEventContext = TBoardEventContext> {
  protected internalRef: Record<TPieceId, TPieceInternalRef> = {} as Record<
    TPieceId,
    TPieceInternalRef
  >;
  protected selected: TSelected | null = null;
  protected pieceHover: TPieceId | null = null;
  protected isImagesLoaded: boolean = false;
  protected destroyed = false;
  protected animationDuration: number = 400;
  protected piecesToRender: { piece: TPieceInternalRef; id: TPieceId }[] = [];
  protected isMoving: boolean = false;
  protected board: Record<TNotation, TPieceBoard>;
  protected hoverConfig: THoverConfig = {
    highlight: true,
    scaling: false,
    scaleAmount: 1.05,
  };
  pipelineRender = new PipelineRender(this);

  public boardEvents: BoardEvents = new BoardEvents(this);
  public helpers: EngineHelpers = new EngineHelpers(this);
  public renderer: IRenderer;
  private mounted = false;

  eventsRuntime: Record<TPipelineRender, Function | null> = {
    onPointerSelect: this.setSelected.bind(this),
    onPointerHover: this.setPieceHover.bind(this),
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

  constructor(private args: TBoardRuntime<T>) {
    Object.assign(this, args);
    if (args.hoverConfig) this.hoverConfig = args.hoverConfig;
    this.renderer =
      args.mode === "2d" ? new Renderer2D(this) : new Renderer3D(this);

    if (Utils.validateFen(args.board)) this.board = Utils.parseFen(args.board);
    else
      this.board = Utils.parseFen(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"
      );
  }

  static async create(args: TBoardRuntime) {
    const this_ = new BoardRuntime(args);
    await this_.init();
    return this_;
  }

  destroy() {
    if (!this.mounted) return;
    this.destroyed = true;
    this.args.canvasLayers.destroy();
    this.helpers.destroy();
    this.boardEvents.destroy();
    this.pipelineRender.destroy();

    (this.args.canvasLayers as any) = null;
    (this.helpers as any) = null;
    (this.boardEvents as any) = null;
    (this.pipelineRender as any) = null;

    if (this.args.pieceStyle) {
      Object.entries(this.args.pieceStyle).map(([_, val]) => {
        if (val instanceof HTMLImageElement) {
          val.src = "";
          val.onload = null;
          val.onerror = null;
        }
        (val as any) = null;
      });
    }
  }

  getSize() {
    return this.args.size;
  }

  mount() {
    this.mounted = true;
  }

  getIsBlackView() {
    return this.args.isBlackView;
  }

  getSelected() {
    return this.selected;
  }

  getInternalRefObj() {
    return this.internalRef;
  }

  getPieceHover() {
    return this.pieceHover;
  }

  getBoardCanvas() {
    return this.args.canvasLayers.getCanvas("board");
  }

  getStaticPiecesCanvas() {
    return this.args.canvasLayers.getCanvas("staticPieces");
  }

  getDynamicPiecesCanvas() {
    return this.args.canvasLayers.getCanvas("dynamicPieces");
  }

  getUnderlaycanvas() {
    return this.args.canvasLayers.getCanvas("underlay");
  }

  getOverlaycanvas() {
    return this.args.canvasLayers.getCanvas("overlay");
  }

  getInternalRefVal(key: TPieceId) {
    return this.internalRef[key];
  }

  getLightTile() {
    return this.args.lightTile || "#9a8b6dff";
  }

  getDarkTile() {
    return this.args.darkTile || "#3E2723";
  }

  getPieceStyle() {
    return this.args.pieceStyle;
  }

  getEvents() {
    return this.args.events;
  }

  getInjection() {
    return this.args.injection;
  }

  getBoard() {
    return this.board;
  }

  getMove() {
    return this.args.onMove;
  }

  getCanvasLayers() {
    return this.args.canvasLayers;
  }

  getAnimationDuration() {
    return this.animationDuration;
  }

  getReadonlyInternalRef() {
    return Utils.deepFreeze(this.internalRef);
  }

  getReadonlySelectedRef() {
    return this.selected ? Utils.deepFreeze(this.selected) : null;
  }

  getReadonlyPiece(piece?: TPieceInternalRef, at?: TNotation) {
    return piece ? Utils.deepFreeze(piece) : null;
  }

  getReadonlySquare(square?: TSquare) {
    return square ? Utils.deepFreeze(square) : null;
  }

  getReadonlyAnimation() {
    const animation: TAnimation[] = [];
    for (const layer of this.renderer.getLayerManager().getAllLayers())
      animation.push(
        ...this.renderer
          .getLayerManager()
          .getLayer(layer as TCanvasLayer)
          .getAnimation()
      );
    return Utils.deepFreeze(animation);
  }

  getReadonlyBoard() {
    return Utils.deepFreeze(this.getBoard());
  }

  getDefaultAnimation() {
    return this.args.defaultAnimation;
  }

  getContext(cache: boolean, args: TBoardEventContext) {
    const { squareSize, size, x, y, piece, square } = args;

    const context = this.helpers.createLazyEventContext(
      { squareSize, size, x, y },
      {
        getPiece: () => this.getReadonlyPiece(piece ? piece : undefined),
        getPiecesImage: () => this.getPieceStyle(),
        getSquare: () => this.getReadonlySquare(square ? square : undefined),
        getPieces: () => this.getReadonlyInternalRef(),
        getPieceHover: () => this.getPieceHover(),
        getSelected: () => this.getReadonlySelectedRef(),
        getIsBlackView: () => this.getIsBlackView(),
        getLightTile: () => this.getLightTile(),
        getDarkTile: () => this.getDarkTile(),
        getAnimation: () => this.getReadonlyAnimation(),
        getDraw: () => {
          const event = (context as any).__event;

          const drawFn = (opts: {
            onDraw: (ctx: TSafeCtx) => void;
            layer: TCanvasLayer;
          }) => {
            const { onDraw, layer } = opts;
            const ctx_ = this.getCanvasLayers().getClientContext(layer);
            if (!ctx_) return;
            onDraw(ctx_);
            const clearCtx = ctx_ as TSafeCtx & {
              __drawRegions: TDrawRegion[];
              __clearRegions: () => void;
              __actualRegions: TCanvasCoords[];
            };
            this.renderer
              .getLayerManager()
              .applyDrawResult(clearCtx, layer, event);
          };

          drawFn.batch = (
            optsArr: {
              onDraw: (ctx: TSafeCtx) => void;
              layer: TCanvasLayer;
            }[]
          ) => {
            const layers: Record<
              TCanvasLayer,
              { fn: (ctx: TSafeCtx) => void; index: number }[]
            > = {} as Record<
              TCanvasLayer,
              { fn: (ctx: TSafeCtx) => void; index: number }[]
            >;

            let i = 0;
            for (const { layer, onDraw } of optsArr) {
              if (!layers[layer]) {
                layers[layer] = [];
              }
              layers[layer].push({ fn: onDraw, index: i++ });
            }
            const ordered = Object.values(layers)
              .flat()
              .sort((a, b) => a.index - b.index);
            for (const { fn, index } of ordered) {
              const layer = optsArr[index].layer;
              drawFn.group(layer, (ctx, g) => {
                g.draw(fn);
              });
            }
          };

          drawFn.group = (
            layer: TCanvasLayer,
            fn: (
              ctx: TSafeCtx,
              g: { draw: (onDraw: (ctx: TSafeCtx) => void) => void }
            ) => void
          ) => {
            const ctx_ = this.getCanvasLayers().getClientContext(layer);
            if (!ctx_) return;

            const g = {
              draw: (onDraw: (ctx: TSafeCtx) => void) => onDraw(ctx_),
            };
            fn(ctx_, g);
            const clearCtx = ctx_ as TSafeCtx & {
              __drawRegions: TDrawRegion[];
              __clearRegions: () => void;
              __actualRegions: TCanvasCoords[];
            };
            this.renderer
              .getLayerManager()
              .applyDrawResult(clearCtx, layer, event);
          };
          return drawFn as TDrawFunction;
        },
      },
      { cache }
    );

    return context;
  }

  getIsMoving() {
    return this.isMoving;
  }

  getHoverConfig() {
    const MIN_SCALE = 0.75;
    const MAX_SCALE = 1.15;
    if (
      this.hoverConfig.scaleAmount < MIN_SCALE ||
      this.hoverConfig.scaleAmount > MAX_SCALE
    )
      this.hoverConfig.scaleAmount = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, this.hoverConfig.scaleAmount)
      );

    return this.hoverConfig;
  }

  setHoverConfig(config: THoverConfig) {
    this.hoverConfig = config;
  }

  setIsMoving(b: boolean) {
    this.isMoving = b;
  }

  async setSize(size: number) {
    this.args.size = Math.floor(size / 8) * 8;
    this.getCanvasLayers().clearAllRect();
    this.getCanvasLayers().resize(Math.floor(size / 8) * 8);
    this.setInternalRefObj({} as Record<TPieceId, TPieceInternalRef>);
    this.renderer.getLayerManager().resetAllLayers();
    await this.refreshCanvas(true);
  }

  setAnimationDuration(time: number) {
    if (time < 150 || time > 500) return;
    this.animationDuration = time;
  }

  async setBoardByFen(board: string) {
    if (!Utils.validateFen(board).status) return;
    await this.setPieceHover(null);
    this.setIsMoving(true);
    this.board = Utils.parseFen(board);
    await this.refreshCanvas(false);
    this.setIsMoving(false);
  }

  async setBoard(board: Record<TNotation, TPieceBoard>) {
    board && (this.board = structuredClone(board));
    await this.refreshCanvas(false);
  }

  async refreshCanvas(init: boolean) {
    this.renderer.getLayerManager().setHoverEnabled(false);
    this.helpers.pieceHelper.clearCache();
    this.pipelineRender.setNextEvent("onPointerSelect", [null, true]);
    this.pipelineRender.setNextEvent("onPointerHover", [null, true]);
    await this.initInternalRef();

    const render = (resolve: (value: void | PromiseLike<void>) => void) =>
      this.pipelineRender.setNextEvent("onRender", [init], resolve);

    await Utils.asyncHandler(render);
    this.renderer.getLayerManager().setHoverEnabled(true);

    try {
      if (this.args.onUpdate) this.args.onUpdate();
    } catch (e) {
      console.log(e);
    }
  }

  async resetEvents(render: boolean) {
    this.pipelineRender.setNextEvent("onPointerHover", [null, true]);
    this.pipelineRender.setNextEvent("onPointerSelect", [null, true]);
    if (!render) return;
    const render_ = (resolve: (value: void | PromiseLike<void>) => void) =>
      this.pipelineRender.setNextEvent("onRender", [false], resolve);

    await Utils.asyncHandler(render_);
  }

  updateBoard(piece: TPieceBoard) {
    this.board[piece.square.notation] = piece;
  }

  setInternalRefVal(key: TPieceId, obj: TPieceInternalRef) {
    this.internalRef[key] = obj;
  }

  setInternalRefObj(internalRef: Record<TPieceId, TPieceInternalRef>) {
    this.internalRef = internalRef;
  }

  async setSelected(selected: TSelected | null, noRender?: boolean) {
    if (selected === null && this.selected === null) {
      this.selected = selected;
      return;
    } else if (selected?.id === this.selected?.id) {
      this.selected = selected;
      return;
    } else if (!this.renderer.getLayerManager().isSelectionEnabled()) return;
    const layerManager = this.renderer.getLayerManager();
    this.selected = selected;
    layerManager.drawEvent("onPointerSelect");

    if (!noRender) this.pipelineRender.setNextEvent("onRender", [false]);
  }

  async setPieceHover(piece: TPieceId | null, noRender?: boolean) {
    const lastHover = this.getPieceHover();
    const layerManager = this.renderer.getLayerManager();

    if (lastHover === piece) return;
    else if (!this.renderer.getLayerManager().isHoverEnabled()) return;

    this.pieceHover = piece;
    layerManager.drawEvent("onPointerHover");

    if (this.hoverConfig.scaling) {
      if (piece === null && lastHover !== null) {
        await layerManager.togglePieceLayer(
          "dynamicPieces",
          "staticPieces",
          lastHover,
          noRender
        );
      } else if (lastHover === null && piece !== null) {
        await layerManager.togglePieceLayer(
          "staticPieces",
          "dynamicPieces",
          piece,
          noRender
        );
      } else if (lastHover !== null && piece !== null) {
        await layerManager.togglePieceLayer(
          "dynamicPieces",
          "staticPieces",
          lastHover,
          noRender
        );
        await layerManager.togglePieceLayer(
          "staticPieces",
          "dynamicPieces",
          piece,
          noRender
        );
      }
    } else if (!noRender) this.pipelineRender.setNextEvent("onRender", [false]);
  }

  async setBlackView(b: boolean) {
    if (this.getIsBlackView() === b) return;
    this.args.isBlackView = b;
    this.setInternalRefObj({} as Record<TPieceId, TPieceInternalRef>);
    this.getCanvasLayers().clearAllRect();
    this.renderer.getLayerManager().resetAllLayers();
    await this.refreshCanvas(true);
  }

  deleteIntervalRefVal(key: TPieceId) {
    delete this.internalRef[key];
  }

  async loadImages() {
    if (this.destroyed) return;

    if (!this.isImagesLoaded && this.args.pieceStyle) {
      await this.helpers.pieceHelper.preloadImages(this.args.pieceStyle);
      this.isImagesLoaded = true;
    }
  }

  async init() {
    await new Promise(requestAnimationFrame);
    await this.initPieceImages();
    await this.initInternalRef();
    return new Promise<void>((resolve) => {
      this.pipelineRender.setNextEvent("onRender", [true], resolve);
    });
  }

  async initPieceImages() {
    if (!this.args || !this.args.pieceStyle) {
      this.args.pieceStyle =
        this.helpers.pieceHelper.getPieceImages[this.args.pieceConfig?.type];
    }
    await this.loadImages();
  }

  async toggleCanvas(
    from: TCanvasLayer,
    to: TCanvasLayer,
    pieceId: TPieceId,
    noRender?: boolean
  ) {
    await this.renderer
      .getLayerManager()
      .togglePieceLayer(from, to, pieceId, noRender);
  }

  async render(b: boolean) {
    await this.renderer.render(b);
  }

  async updateBoardState(
    from: TNotation,
    to: TNotation,
    delay: boolean,
    flag?: TMoveFlag
  ) {
    const piece = this.board[from];
    const layerManager = this.renderer.getLayerManager();

    if (flag?.kingSideCastling || flag?.queenSideCastling) {
      const type = piece.type[0];
      let rook = null;
      if (type === "w")
        rook = flag.kingSideCastling ? this.board["h1"] : this.board["a1"];
      else rook = flag.kingSideCastling ? this.board["h8"] : this.board["a8"];
      if (rook) {
        const file = flag.kingSideCastling ? "f" : "d",
          rank = type === "w" ? 1 : 8,
          rookNotation = `${file}${rank}` as TNotation,
          oldSquare = rook.square.notation;

        const kingFile = flag.kingSideCastling ? "g" : "c",
          kingRank = type === "w" ? 1 : 8,
          kingNotation = `${kingFile}${kingRank}` as TNotation;
        piece.square = {
          file: kingFile,
          rank: kingRank,
          notation: kingNotation,
        };
        rook.square = {
          file,
          rank,
          notation: rookNotation,
        };

        this.board[kingNotation] = piece;
        delete this.board[from];

        this.board[rookNotation] = rook;
        delete this.board[oldSquare];

        this.helpers.pieceHelper.updateCache(from, kingNotation, {
          id: piece.id,
          piece: this.getInternalRefVal(piece.id),
        });

        this.helpers.pieceHelper.updateCache(oldSquare, rookNotation, {
          id: rook.id,
          piece: this.getInternalRefVal(rook.id),
        });
      }
    } else {
      let enpassant = null;

      piece.square = {
        file: to.charAt(0) as TFile,
        rank: parseInt(to.charAt(1)) as TRank,
        notation: to,
      };

      if (flag?.enpassant) {
        enpassant =
          piece.type[0] === "w"
            ? `${piece.square.file}${piece.square.rank - 1}`
            : `${piece.square.file}${piece.square.rank + 1}`;
      }

      let enemie = enpassant
        ? this.board[enpassant as TNotation]
        : this.board[to];

      this.board[to] = piece;
      delete this.board[from];

      if (enpassant) {
        delete this.board[enpassant as TNotation];
        this.helpers.pieceHelper.removeCache(enpassant as TNotation);
      }

      this.helpers.pieceHelper.updateCache(from, to, {
        id: piece.id,
        piece: this.getInternalRefVal(piece.id),
      });

      if (enemie) {
        if (delay && this.getDefaultAnimation()) {
          layerManager.addDelayedPieceClear(piece.id, enemie.id);
        } else layerManager.getLayer("staticPieces").removeAll?.(enemie.id);

        this.deleteIntervalRefVal(enemie.id);
      }
      (enemie as any) = null;
    }

    await this.refreshCanvas(false);
  }

  async initInternalRef() {
    const squareSize = Math.floor(this.args.size / 8);
    const ids = Object.values(this.board);
    const layerManager = this.renderer.getLayerManager();
    this.renderer.getLayerManager().getLayer("staticPieces").clearPieces?.(ids);

    for (const piece of Object.values(this.board)) {
      const existing = this.internalRef[piece.id];

      if (existing && existing.square.notation === piece.square.notation)
        continue;

      const square =
        piece.square &&
        Utils.squareToCoords(piece.square, squareSize, this.args.isBlackView);

      if (!square) continue;
      const startX = square.x;
      const startY = square.y;
      const coords: TCanvasCoords = {
        x: Math.floor(startX),
        y: Math.floor(startY),
        w: Math.ceil(squareSize),
        h: Math.ceil(squareSize),
      };

      const ref: TPieceInternalRef = {
        square: piece.square,
        type: piece.type,
        x: startX,
        y: startY,
      };

      this.setInternalRefVal(piece.id as TPieceId, ref);
      if (!existing) {
        layerManager
          .getLayer("staticPieces")
          .addAll?.(piece.id, ref, coords, coords);
        continue;
      }
      if (piece.square.notation !== existing.square.notation) {
        if (!this.getEvents()?.onDrawPiece && this.args.defaultAnimation) {
          ref.anim = true;
          this.setIsMoving(true);
        }
        layerManager.getLayer("dynamicPieces").addAnimation({
          from: { x: existing.x, y: existing.y },
          to: { x: square.x, y: square.y },
          piece: ref,
          start: performance.now(),
          id: piece.id,
        });

        if (this.args.defaultAnimation)
          await layerManager.togglePieceLayer(
            "staticPieces",
            "dynamicPieces",
            piece.id,
            true
          );
        else {
          const layer = layerManager.getLayer("staticPieces");
          layer.removeAll?.(piece.id);
          layer.addAll?.(piece.id, ref, coords, coords);
        }
      }
    }
    this.deleteInternalRef(ids);
  }

  private deleteInternalRef(pieces: TPieceBoard[]) {
    const nextIds = new Set(pieces.map((p) => p.id));

    for (const id in this.internalRef) {
      if (!nextIds.has(id as TPieceId)) {
        delete this.internalRef[id as TPieceId];
      }
    }
  }
}

export default BoardRuntime;
