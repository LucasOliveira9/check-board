import Draw from "../draw/draw";
import { TBoardRuntime, TSelected } from "../../types/board";
import { TBoardEventContext } from "../../types/events";
import { TPieceBoard, TPieceId, TPieceInternalRef } from "../../types/piece";
import BoardEvents from "./BoardEvents";
import { squareToCoords } from "../../utils/coords";
import EngineHelpers from "../helpers/engineHelpers";

class BoardRuntime<T extends TBoardEventContext = TBoardEventContext> {
  protected drawRef = 0;
  protected internalRef: Record<TPieceId, TPieceInternalRef> = {} as Record<
    TPieceId,
    TPieceInternalRef
  >;
  protected selected: TSelected | null = null;
  protected pieceHover: TPieceId | null = null;
  protected animation: {
    from: { x: number; y: number };
    to: { x: number; y: number };
    piece: TPieceInternalRef;
    start: number;
  }[] = [];
  private isImagesLoaded: boolean = false;
  private destroyed = false;
  private animationRef: number | null = null;
  private isPieceRendering = false;
  private animationDuration: number = 400;
  private piecesToRender: { piece: TPieceInternalRef; id: TPieceId }[] = [];
  public boardEvents: BoardEvents = new BoardEvents(this);
  public draw: Draw = new Draw(this);
  public helpers: EngineHelpers = new EngineHelpers(this);

  constructor(protected args: TBoardRuntime<T>) {
    Object.assign(this, args);
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

  setAnimationDuration(time: number) {
    if (time < 150 || time > 500) return;
    this.animationDuration = time;
  }

  setIsPieceRendering(b: boolean) {
    this.isPieceRendering = b;
  }

  setBoard(board: TPieceBoard[] | undefined) {
    board && (this.args.board = structuredClone(board));
    this.helpers.pieceHelper.clearCache();
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

  deleteIntervalRefVal(key: TPieceId) {
    delete this.internalRef[key];
  }

  renderBoard() {
    if (!this.args.canvasLayers) return;
    const canvas = this.args.canvasLayers.getCanvas("board").current;
    let ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    this.args.canvasLayers?.keepQuality("board", this.args.size);
    this.draw.board();
    ctx = null;
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
        ref.anim = true;
        this.animation.push({
          from: { x: startX, y: startY },
          to: { x: square.x, y: square.y },
          piece: ref,
          start: performance.now(),
        });
      }
    }
  }
}

export default BoardRuntime;
