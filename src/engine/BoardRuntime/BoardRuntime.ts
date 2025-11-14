import Draw from "../draw/draw";
import { TBoardRuntime, TSelected } from "../../types/board";
import { TAnimation, TBoardEventContext, TEvents } from "../../types/events";
import { TPieceBoard, TPieceId, TPieceInternalRef } from "../../types/piece";
import BoardEvents from "./BoardEvents";
import EngineHelpers from "../helpers/engineHelpers";
import { TFile, TNotation, TRank, TSquare } from "../../types/square";
import { IRenderer } from "../render/interface";
import Renderer2D from "../render/renderer2D";
import Renderer3D from "../render/renderer3D";
import Utils from "../../utils/utils";
import { TCanvasLayer, TDrawRegion } from "src/types/draw";
import { TSafeCtx } from "src/types/draw";

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
  public boardEvents: BoardEvents = new BoardEvents(this);
  public draw: Draw = new Draw(this);
  public helpers: EngineHelpers = new EngineHelpers(this);
  public renderer!: IRenderer;

  constructor(protected args: TBoardRuntime<T>) {
    Object.assign(this, args);
    this.renderer =
      this.args.mode === "2d" ? new Renderer2D(this) : new Renderer3D(this);
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
    return this.args.board;
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
        getDraw:
          () =>
          (opts: {
            onDraw: (ctx: TSafeCtx) => void;
            layer: TCanvasLayer;
            event: TEvents;
          }) => {
            const { onDraw, layer, event } = opts;
            const context = this.getCanvasLayers().getContext(layer);
            if (!context) return;
            const ctx_ = Utils.createSafeCtx(context);
            onDraw(ctx_);
            this.handleDrawResult(event, ctx_, layer);
            ctx_.__clearRegions();
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

  setBoard(board: TPieceBoard[] | undefined) {
    board && (this.args.board = structuredClone(board));
    this.refreshCanvas();
  }

  refreshCanvas() {
    this.helpers.pieceHelper.clearCache();
    this.clearAnimation();
    //if (Utils.isRenderer2D(this.renderer)) this.renderer.resetStaticPieces();
    this.initInternalRef();
    this.renderPieces();
    this.renderUnderlayAndOverlay();
  }

  updateBoard(piece: TPieceBoard, enemie?: TPieceId) {
    for (let i = this.args.board.length - 1; i >= 0; i--) {
      const b = this.args.board[i];

      if (b.id === piece.id) b.square = piece.square;
      else if (b.id === enemie) this.args.board.splice(i, 1);
    }
  }

  setInternalRefVal(key: TPieceId, obj: TPieceInternalRef) {
    this.internalRef[key] = obj;
  }

  setInternalRefObj(internalRef: Record<TPieceId, TPieceInternalRef>) {
    this.internalRef = internalRef;
  }

  setSelected(selected: TSelected | null) {
    Utils.isRenderer2D(this.renderer) &&
      this.renderer.clearEvent("onPointerSelect");
    this.selected = selected;
  }

  setPieceHover(piece: TPieceId | null) {
    this.pieceHover = piece;
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
    },
    layer: TCanvasLayer
  ) {
    if (!Utils.isRenderer2D(this.renderer)) return;
    const regions = ctx_.__drawRegions;
    if (!regions.length) return;
    for (const coords of regions) this.renderer.addToClear(coords, layer);
  }

  updateBoardState(from: TNotation, to: TNotation, piece: TPieceBoard) {
    const newBoard: TPieceBoard[] = [];

    for (const piece of this.getBoard()) {
      if (piece.square.notation === to) continue;
      else if (piece.square.notation !== from) {
        newBoard.push({ ...piece });
        continue;
      }
      newBoard.push({
        ...piece,
        square: {
          file: to.charAt(0) as TFile,
          rank: parseInt(to.charAt(1)) as TRank,
          notation: to,
        },
      });
    }
    this.setBoard(newBoard);
    if (this.args.onUpdate) {
      this.args.onUpdate();
    }
  }

  initInternalRef(internal?: boolean) {
    const lastInternalRef = structuredClone(this.internalRef);
    if (!internal)
      this.setInternalRefObj({} as Record<TPieceId, TPieceInternalRef>);
    const squareSize = this.args.size / 8;

    if (Utils.isRenderer2D(this.renderer))
      this.renderer.clearStaticPieces(this.args.board);

    for (const piece of this.args.board) {
      const lastExisting = this.args.defaultAnimation
        ? lastInternalRef[piece.id as TPieceId]
        : null;
      const existing = internal ? this.internalRef[piece.id as TPieceId] : null;

      if (existing && existing.square.notation === piece.square.notation)
        continue;
      const currInternal = existing ? existing : lastExisting;
      const square =
        piece.square &&
        Utils.squareToCoords(piece.square, squareSize, this.args.isBlackView);

      if (!square) continue;
      const startX = currInternal?.x ?? square.x;
      const startY = currInternal?.y ?? square.y;
      const ref: TPieceInternalRef = {
        square: piece.square,
        type: piece.type,
        x: startX,
        y: startY,
      };

      this.setInternalRefVal(piece.id as TPieceId, ref);

      if (
        currInternal &&
        piece.square.notation !== currInternal.square.notation
      ) {
        if (!this.getEvents()?.onDrawPiece) ref.anim = true;
        this.animation.push({
          from: { x: startX, y: startY },
          to: { x: square.x, y: square.y },
          piece: ref,
          start: performance.now(),
          id: piece.id,
        });

        if (Utils.isRenderer2D(this.renderer))
          this.renderer.addToClear(
            {
              x: startX,
              y: startY,
              w: squareSize,
              h: squareSize,
            },
            "staticPieces"
          );

        this.renderer.deleteStaticPiece(piece.id);
        this.renderer.addDynamicPiece(piece.id, ref);
      } else {
        this.renderer.deleteDynamicPiece(piece.id);
        this.renderer.addStaticPiece(piece.id, ref);
      }
    }
  }
}

export default BoardRuntime;
