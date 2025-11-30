import { TBoardRuntime, TSelected } from "../../types/board";
import {
  TAnimation,
  TBoardEventContext,
  TDrawFunction,
  TEvents,
} from "../../types/events";
import {
  TPiece,
  TPieceBoard,
  TPieceCoords,
  TPieceId,
  TPieceInternalRef,
} from "../../types/piece";
import BoardEvents from "./BoardEvents";
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
  TRender,
} from "../../types/draw";
import { TSafeCtx } from "../../types/draw";

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
  public boardEvents: BoardEvents = new BoardEvents(this);
  public helpers: EngineHelpers = new EngineHelpers(this);
  public renderer: IRenderer;

  constructor(protected args: TBoardRuntime<T>) {
    Object.assign(this, args);

    this.renderer =
      args.mode === "2d" ? new Renderer2D(this) : new Renderer3D(this);

    if (Utils.validateFen(args.board)) this.board = Utils.parseFen(args.board);
    else
      this.board = Utils.parseFen(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"
      );
  }

  destroy() {
    //this.clearAnimation();
    this.args.canvasLayers.destroy();
    this.helpers.destroy();
    this.boardEvents.destroy();

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

    for (const key of Object.getOwnPropertyNames(this)) {
      (this as any)[key] = null;
    }
    this.destroyed = true;
  }

  getSize() {
    return this.args.size;
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

  getReadonlyPiece(piece?: TPieceInternalRef) {
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
            };
            this.handleDrawResult(clearCtx, layer, event);
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
            };
            this.handleDrawResult(clearCtx, layer, event);
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

  setIsMoving(b: boolean) {
    this.isMoving = b;
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
    await this.refreshCanvas();
    this.setIsMoving(false);
  }

  async setBoard(board: Record<TNotation, TPieceBoard>) {
    board && (this.board = structuredClone(board));
    await this.refreshCanvas();
  }

  async refreshCanvas() {
    this.helpers.pieceHelper.clearCache();
    this.selected = null;
    //this.clearAnimation();
    await this.initInternalRef();
    await this.renderPieces();
    this.renderUnderlayAndOverlay();
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

  setSelected(selected: TSelected | null) {
    if (selected === null && this.selected === null) {
      this.selected = selected;
      return;
    } else if (selected?.id === this.selected?.id) {
      this.selected = selected;
      return;
    }
    const layerManager = this.renderer.getLayerManager();
    layerManager.setSelectionEnabled(true);
    layerManager.removeEvent("onPointerSelect", true);
    this.selected = selected;
    this.renderUnderlayAndOverlay();
    this.renderer.getLayerManager().setSelectionEnabled(false);
  }

  async setPieceHover(piece: TPieceId | null) {
    const lastHover = this.getPieceHover();
    const layerManager = this.renderer.getLayerManager();
    if (lastHover === null && piece === null) return;
    else if (lastHover === piece) return;
    this.renderer.getLayerManager().setHoverEnabled(true);
    layerManager.removeEvent("onPointerHover", true);
    this.pieceHover = piece;
    if (piece === null && lastHover !== null) {
      await layerManager.togglePieceLayer(
        "dynamicPieces",
        "staticPieces",
        lastHover
      );
    } else if (lastHover === null && piece !== null) {
      await layerManager.togglePieceLayer(
        "staticPieces",
        "dynamicPieces",
        piece
      );
    } else if (lastHover !== null && piece !== null) {
      await layerManager.togglePieceLayer(
        "dynamicPieces",
        "staticPieces",
        lastHover
      );
      await layerManager.togglePieceLayer(
        "staticPieces",
        "dynamicPieces",
        piece
      );
    }

    this.renderer.renderClientOverlayEvents();
    this.renderer.getLayerManager().setHoverEnabled(false);
  }

  setBlackView(b: boolean) {
    if (this.getIsBlackView() === b) return;
    this.args.isBlackView = b;
    this.setInternalRefObj({} as Record<TPieceId, TPieceInternalRef>);
    // this.clearAnimation();
    this.getCanvasLayers().clearAllRect();
    this.renderer.getLayerManager().resetAllLayers();
    this.renderer.renderBoard();
    this.refreshCanvas();
  }

  deleteIntervalRefVal(key: TPieceId) {
    delete this.internalRef[key];
  }

  async renderPieces() {
    if (this.destroyed) return;

    if (!this.isImagesLoaded && this.args.pieceStyle) {
      await this.helpers.pieceHelper.preloadImages(this.args.pieceStyle);
      this.isImagesLoaded = true;
    }

    this.renderer.renderStaticPieces();
    await this.renderer.renderDynamicPieces();
  }

  renderUnderlayAndOverlay() {
    if (this.destroyed) return;
    this.renderer.renderUnderlay();
    this.renderer.renderOverlay();
    this.renderer.renderClientOverlayEvents();
  }

  async init() {
    this.initPieceImages();
    await this.initInternalRef();
    await new Promise(requestAnimationFrame);
    this.renderer.renderBoard();
    await this.renderPieces();
  }

  initPieceImages() {
    if (!this.args.pieceStyle) {
      this.args.pieceStyle =
        this.helpers.pieceHelper.getPieceImages[this.args.pieceConfig?.type];
    }
  }

  handleDrawResult(
    ctx_: TSafeCtx & {
      __drawRegions: TDrawRegion[];
      __clearRegions: () => void;
    },
    layer: TCanvasLayer,
    event?: TEvents,
    record?: TPieceId
  ) {
    const regions = ctx_.__drawRegions;
    if (!regions.length) return;

    for (const coords of regions) {
      if (record) {
        this.renderer
          .getLayerManager()
          .getLayer(layer)
          .addCoords(record, coords);
      }
      if (event)
        this.renderer.getLayerManager().getLayer(layer).addEvent(event, coords);
    }

    ctx_.__clearRegions();
  }

  updateBoardState(from: TNotation, to: TNotation) {
    const piece = this.board[from];
    let enemie = this.board[to];
    piece.square = {
      file: to.charAt(0) as TFile,
      rank: parseInt(to.charAt(1)) as TRank,
      notation: to,
    };

    this.board[to] = piece;
    delete this.board[from];

    enemie && this.deleteIntervalRefVal(enemie.id);
    (enemie as any) = null;

    this.refreshCanvas();

    if (this.args.onUpdate) {
      this.args.onUpdate();
    }
  }

  async initInternalRef() {
    const squareSize = this.args.size / 8;
    const ids = Object.values(this.board);
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
        x: startX,
        y: startY,
        w: squareSize,
        h: squareSize,
      };

      const ref: TPieceInternalRef = {
        square: piece.square,
        type: piece.type,
        x: startX,
        y: startY,
      };

      this.setInternalRefVal(piece.id as TPieceId, ref);
      if (!existing) {
        this.renderer
          .getLayerManager()
          .getLayer("staticPieces")
          .addAll?.(piece.id, ref, coords);
        continue;
      }
      if (piece.square.notation !== existing.square.notation) {
        if (!this.getEvents()?.onDrawPiece && this.args.defaultAnimation) {
          ref.anim = true;
          this.setIsMoving(true);
        }
        this.renderer
          .getLayerManager()
          .getLayer("dynamicPieces")
          .addAnimation({
            from: { x: existing.x, y: existing.y },
            to: { x: square.x, y: square.y },
            piece: ref,
            start: performance.now(),
            id: piece.id,
          });

        if (this.args.defaultAnimation)
          await this.renderer
            .getLayerManager()
            .togglePieceLayer("staticPieces", "dynamicPieces", piece.id, true);
        else
          await this.renderer
            .getLayerManager()
            .togglePieceLayer("staticPieces", "staticPieces", piece.id, true);
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
