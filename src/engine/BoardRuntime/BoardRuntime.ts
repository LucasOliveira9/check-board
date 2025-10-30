import Draw from "../draw/draw";
import { TBoardRuntime, TSelected } from "../../types/board";
import { TAnimation, TBoardEventContext } from "../../types/events";
import {
  TPieceBoard,
  TPieceId,
  TPieceImage,
  TPieceInternalRef,
  TPieceKey,
} from "../../types/piece";
import BoardEvents from "./BoardEvents";
import { coordsToSquare, squareToCoords } from "../../utils/coords";
import EngineHelpers from "../helpers/engineHelpers";
import deepFreeze from "../../utils/deepFreeze";
import { TSquare } from "../../types/square";
import { IRenderer } from "../render/interface";
import Renderer2D from "../render/renderer2D";
import Renderer3D from "../render/renderer3D";

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
  protected isPieceRendering = false;
  protected animationDuration: number = 400;
  protected piecesToRender: { piece: TPieceInternalRef; id: TPieceId }[] = [];
  public boardEvents: BoardEvents = new BoardEvents(this);
  public draw: Draw = new Draw(this);
  public helpers: EngineHelpers = new EngineHelpers(this);
  protected renderer!: IRenderer;

  constructor(protected args: TBoardRuntime<T>) {
    Object.assign(this, args);
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

  getPiecescanvas() {
    return this.args.canvasLayers.getCanvas("pieces");
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
    return this.args.move;
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

  getIsPieceRendering() {
    return this.isPieceRendering;
  }

  getAnimationDuration() {
    return this.animationDuration;
  }

  getReadonlyInternalRef() {
    return deepFreeze(this.internalRef);
  }

  getReadonlySelectedRef() {
    return this.selected ? deepFreeze(this.selected) : null;
  }

  getReadonlyPiece(piece?: TPieceInternalRef) {
    return piece ? deepFreeze(piece) : null;
  }

  getReadonlySquare(square?: TSquare) {
    return square ? deepFreeze(square) : null;
  }

  getReadonlyAnimation() {
    return deepFreeze(this.animation);
  }

  getContext(cache: boolean, args: TBoardEventContext) {
    const { ctx, squareSize, size, x, y, piece, square, canvas } = args;

    const context = this.helpers.createLazyEventContext(
      { ctx, squareSize, size, x, y },
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
        getCanvas: () => canvas,
        getAnimation: () => this.getReadonlyAnimation(),
      },
      { cache }
    );

    return context;
  }

  setAnimationDuration(time: number) {
    if (time < 150 || time > 500) return;
    this.animationDuration = time;
  }

  setIsPieceRendering(b: boolean) {
    this.isPieceRendering = b;
  }

  setBoard(board: TPieceBoard[] | undefined) {
    board && (this.args.board = structuredClone(board));
    this.refreshCanvas();
  }

  refreshCanvas() {
    this.helpers.pieceHelper.clearCache();
    //this.clearAnimation();
    this.initInternalRef();
    this.renderPieces();
    this.renderOverlay();
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
    this.selected = selected;
  }

  setPieceHover(piece: TPieceId | null) {
    this.pieceHover = piece;
  }

  setBlackView(b: boolean) {
    this.args.isBlackView = b;
    this.setInternalRefObj({} as Record<TPieceId, TPieceInternalRef>);
    this.clearAnimation();
    this.renderBoard();
    this.refreshCanvas();
  }

  deleteIntervalRefVal(key: TPieceId) {
    delete this.internalRef[key];
  }

  renderBoard() {
    if (!this.args.canvasLayers) return;
    const canvas = this.args.canvasLayers.getCanvas("board").current;
    if (!canvas) return;
    this.args.canvasLayers?.keepQuality("board", this.args.size);
    this.draw.board();
  }

  async renderPieces() {
    if (this.destroyed) return;
    const canvas = this.args.canvasLayers.getCanvas("pieces").current;
    if (canvas === null) return;
    this.args.canvasLayers?.keepQuality("pieces", this.args.size);

    if (!this.isImagesLoaded && this.args.pieceStyle) {
      await this.helpers.pieceHelper.preloadImages(this.args.pieceStyle);
      this.isImagesLoaded = true;
    }

    const render = (time: number) => {
      if (this.animation.length > 0)
        this.animationRef = requestAnimationFrame(render);
      else this.clearAnimation();

      this.draw.pieces(time);
    };
    if (!this.animationRef && this.animation.length)
      this.animationRef = requestAnimationFrame(render);
    if (!this.animationRef) this.draw.pieces();
  }

  renderOverlay() {
    if (this.destroyed) return;
    const canvas = this.args.canvasLayers.getCanvas("overlay").current;
    if (!canvas === null) return;
    this.args.canvasLayers.keepQuality("overlay", this.args.size);

    this.draw.overlay();
  }

  clearAnimation() {
    this.animationRef && cancelAnimationFrame(this.animationRef);
    this.animationRef = null;
  }

  updateAnimation() {
    this.animation = this.animation.filter((anim) => anim.piece.anim);
    console.log(this.animation);
  }

  init() {
    this.initPieceImages();
    this.initInternalRef();
    this.renderBoard();
    this.renderPieces();
  }

  initPieceImages() {
    if (!this.args.pieceStyle) {
      this.args.pieceStyle =
        this.helpers.pieceHelper.getPieceImages[this.args.pieceConfig?.type];
    }
  }

  initInternalRef(internal?: boolean) {
    const lastInternalRef = structuredClone(this.internalRef);
    if (!internal)
      this.setInternalRefObj({} as Record<TPieceId, TPieceInternalRef>);
    const squareSize = this.args.size / 8;

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
        squareToCoords(piece.square, squareSize, this.args.isBlackView);

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
        if (!this.getEvents()?.drawPiece) ref.anim = true;
        this.animation.push({
          from: { x: startX, y: startY },
          to: { x: square.x, y: square.y },
          piece: ref,
          start: performance.now(),
          id: piece.id,
        });
      }
    }
  }
}

export default BoardRuntime;
