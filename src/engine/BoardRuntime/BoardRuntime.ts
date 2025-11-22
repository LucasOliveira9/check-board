import Draw from "../draw/draw";
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
import { TCanvasLayer, TDrawRegion } from "../../types/draw";
import { TSafeCtx } from "../../types/draw";

class BoardRuntime<T extends TBoardEventContext = TBoardEventContext> {
  protected drawRef = 0;
  protected internalRef: Record<TPieceId, TPieceInternalRef> = {} as Record<
    TPieceId,
    TPieceInternalRef
  >;
  protected selected: TSelected | null = null;
  protected pieceHover: TPieceId | null = null;
  protected animation: TAnimation = [];
  protected isImagesLoaded: boolean = false;
  protected destroyed = false;
  protected animationRef: number | null = null;
  protected animationDuration: number = 400;
  protected piecesToRender: { piece: TPieceInternalRef; id: TPieceId }[] = [];
  protected isMoving: boolean = false;
  protected board: Record<TNotation, TPieceBoard>;
  public boardEvents: BoardEvents = new BoardEvents(this);
  public draw: Draw = new Draw(this);
  public helpers: EngineHelpers = new EngineHelpers(this);
  public renderer!: IRenderer;

  constructor(protected args: TBoardRuntime<T>) {
    Object.assign(this, args);
    this.renderer =
      this.args.mode === "2d" ? new Renderer2D(this) : new Renderer3D(this);
    if (Utils.validateFen(args.board)) this.board = Utils.parseFen(args.board);
    else
      this.board = Utils.parseFen(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"
      );
    this.init();
  }

  destroy() {
    this.clearAnimation();
    this.args.canvasLayers.destroy();
    this.draw.destroy();
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

  getAnimation() {
    return this.animation;
  }

  getAnimationRef() {
    return this.animationRef;
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
    return Utils.deepFreeze(this.animation);
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
            this.handleDrawResult(event, clearCtx, layer);
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
            this.handleDrawResult(event, clearCtx, layer);
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

  setAnimationRef(ref: number) {
    this.animationRef = ref;
  }

  setIsMoving(b: boolean) {
    this.isMoving = b;
  }

  setAnimationDuration(time: number) {
    if (time < 150 || time > 500) return;
    this.animationDuration = time;
  }

  setBoardByFen(board: string) {
    if (!Utils.validateFen(board).status) return;
    this.board = Utils.parseFen(board);
    this.refreshCanvas();
  }

  setBoard(board: Record<TNotation, TPieceBoard>) {
    board && (this.board = structuredClone(board));
    this.refreshCanvas();
  }

  refreshCanvas() {
    this.helpers.pieceHelper.clearCache();
    this.clearAnimation();
    this.initInternalRef();
    this.renderPieces();
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
    this.draw.setIsSelected(false);
    Utils.isRenderer2D(this.renderer) &&
      this.renderer.clearEvent("onPointerSelect");
    this.selected = selected;
    this.renderUnderlayAndOverlay();
    this.draw.setIsSelected(true);
  }

  setPieceHover(piece: TPieceId | null) {
    if (this.pieceHover === null && piece === null) return;
    else if (this.pieceHover === piece) return;
    this.draw.setIsHovered(false);
    this.pieceHover = piece;
    this.renderPieces();
    this.renderer.renderClientOverlayEvents();
    this.draw.setIsHovered(true);
  }

  setBlackView(b: boolean) {
    if (this.getIsBlackView() === b) return;
    this.args.isBlackView = b;
    this.setInternalRefObj({} as Record<TPieceId, TPieceInternalRef>);
    this.clearAnimation();
    this.getCanvasLayers().clearAllRect();
    if (Utils.isRenderer2D(this.renderer)) this.renderer.resetStaticPieces();
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
    this.renderer.renderDynamicPieces();
  }

  renderUnderlayAndOverlay() {
    if (this.destroyed) return;
    this.renderer.renderUnderlay();
    this.renderer.renderOverlay();
    this.renderer.renderClientOverlayEvents();
  }

  clearAnimation() {
    this.animationRef && cancelAnimationFrame(this.animationRef);
    this.animationRef = null;
  }

  updateAnimation() {
    this.animation = this.animation.filter((anim) => anim.piece.anim);
    this.animation.length <= 0 && this.setIsMoving(false);
  }

  init() {
    this.initPieceImages();
    this.initInternalRef();
    this.renderer.renderBoard();
    this.renderPieces();
  }

  initPieceImages() {
    if (!this.args.pieceStyle) {
      this.args.pieceStyle =
        this.helpers.pieceHelper.getPieceImages[this.args.pieceConfig?.type];
    }
  }

  handleDrawResult(
    event: TEvents,
    ctx_: TSafeCtx & {
      __drawRegions: TDrawRegion[];
      __clearRegions: () => void;
    },
    layer: TCanvasLayer
  ) {
    if (!Utils.isRenderer2D(this.renderer)) return;
    const regions = ctx_.__drawRegions;
    if (!regions.length) return;
    for (const coords of regions) this.renderer.addToClear(coords, layer);
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

  initInternalRef() {
    const squareSize = this.args.size / 8;
    const ids = Object.values(this.board);
    Utils.isRenderer2D(this.renderer) && this.renderer.clearStaticPieces(ids);

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

      const ref: TPieceInternalRef = {
        square: piece.square,
        type: piece.type,
        x: startX,
        y: startY,
      };

      this.setInternalRefVal(piece.id as TPieceId, ref);
      if (!existing) {
        this.renderer.addStaticPiece(piece.id, ref);
        continue;
      }
      if (piece.square.notation !== existing.square.notation) {
        if (!this.getEvents()?.onDrawPiece && this.args.defaultAnimation) {
          ref.anim = true;
          this.setIsMoving(true);
        }
        this.animation.push({
          from: { x: existing.x, y: existing.y },
          to: { x: square.x, y: square.y },
          piece: ref,
          start: performance.now(),
          id: piece.id,
        });

        if (this.args.defaultAnimation) {
          this.renderer.deleteStaticPiece(piece.id);
          this.renderer.addDynamicPiece(piece.id, ref);
        } else {
          this.renderer.deleteStaticPiece(piece.id);
          this.renderer.addStaticPiece(piece.id, ref);
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
