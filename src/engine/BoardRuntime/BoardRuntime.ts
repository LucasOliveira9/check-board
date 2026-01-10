import {
  TBoardRuntime,
  TDefault,
  TPipelineRender,
  TSelected,
} from "../../types/board";
import {
  TAnimation,
  TBoardEventContext,
  TDrawFunction,
  TMoveResult,
  TMoveReturn,
} from "../../types/events";
import {
  pieceKey,
  TPiece,
  TPieceBoard,
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
  protected animationDuration: number = 300;
  protected piecesToRender: { piece: TPieceInternalRef; id: TPieceId }[] = [];
  protected isMoving: boolean = false;
  protected board!: Record<TNotation, TPieceBoard>;
  protected hoverConfig: THoverConfig = {
    highlight: true,
    scaling: false,
    scaleAmount: 1.05,
  };

  public boardEvents: BoardEvents = new BoardEvents(this);
  public helpers: EngineHelpers = new EngineHelpers(this);
  public renderer: IRenderer;
  private mounted = false;
  private default: TDefault = {
    onPointerSelect: true,
    onPointerHover: true,
    moveAnimation: true,
  };

  activePiecesPool: Record<TPiece, Map<TNotation, TPieceId>> = {
    wP: new Map(),
    wR: new Map(),
    wN: new Map(),
    wB: new Map(),
    wQ: new Map(),
    wK: new Map(),
    bP: new Map(),
    bR: new Map(),
    bN: new Map(),
    bB: new Map(),
    bQ: new Map(),
    bK: new Map(),
  };

  inactivePiecesPool: Record<TPiece, TPieceId[]> = {
    wP: [],
    wR: [],
    wN: [],
    wB: [],
    wQ: [],
    wK: [],
    bP: [],
    bR: [],
    bN: [],
    bB: [],
    bQ: [],
    bK: [],
  };

  piecesBoard: Map<TPieceId, TPieceBoard> = new Map();

  constructor(private args: TBoardRuntime<T>) {
    Object.assign(this, args);
    if (args.hoverConfig) this.hoverConfig = args.hoverConfig;
    this.renderer =
      args.mode === "2d" ? new Renderer2D(this) : new Renderer3D(this);

    this.setInactivePieces();
    if (Utils.validateFen(args.board))
      this.setBoard(Utils.parseFen(args.board));
    else
      this.setBoard(
        Utils.parseFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
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

    (this.args.canvasLayers as any) = null;
    (this.helpers as any) = null;
    (this.boardEvents as any) = null;

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

  addPieceBoard(id: TPieceId, piece: TPieceBoard) {
    this.piecesBoard.set(id, piece);
  }

  deletePieceBoard(id: TPieceId) {
    this.piecesBoard.delete(id);
  }

  getPieceBoard(id: TPieceId) {
    return this.piecesBoard.get(id);
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

  getDefault() {
    if (this.args.default) return this.args.default;
    return this.default;
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
    return this.args.default.moveAnimation;
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

  isActivePiece(pieceId: TPieceId) {
    const square = this.piecesBoard.get(pieceId)?.square;
    return square ? true : false;
  }

  setHoverConfig(config: THoverConfig) {
    this.hoverConfig = config;
  }

  setIsMoving(b: boolean) {
    this.isMoving = b;
  }

  setInactivePieces() {
    for (let total = 1; total <= 64; total++) {
      for (const key of pieceKey) {
        const id = `${key}${total}` as TPieceId;
        this.inactivePiecesPool[key].push(id);
        const piece: TPieceBoard = {
          square: null,
          type: key,
          id,
        };
        this.piecesBoard.set(id, piece);
      }
    }
  }

  getInactivePiece(key: TPiece) {
    return this.inactivePiecesPool[key].shift();
  }

  addInactivePiece(key: TPiece, id: TPieceId) {
    this.inactivePiecesPool[key].unshift(id);
  }

  async setSize(size: number) {
    this.args.size = Math.floor(size / 8) * 8;
    this.getCanvasLayers().clearAllRect();
    this.getCanvasLayers().resize(Math.floor(size / 8) * 8);
    this.setInternalRefObj({} as Record<TPieceId, TPieceInternalRef>);
    this.renderer.getLayerManager().resetAllLayers();
    await this.refreshCanvases({
      board: true,
      staticPieces: true,
      overlay: true,
      underlay: true,
      dynamicPieces: true,
    });
  }

  setAnimationDuration(time: number) {
    if (time < 150 || time > 500) return;
    this.animationDuration = time;
  }

  async setBoardByFen(board: string) {
    if (!Utils.validateFen(board).status) return;
    this.setIsMoving(true);
    this.setBoard(Utils.parseFen(board));
    await this.refreshCanvases({
      board: false,
      staticPieces: true,
      overlay: true,
      underlay: true,
      dynamicPieces: true,
    });
    this.setIsMoving(false);
  }

  setBoard(pieces: Record<TPiece, TNotation[]>) {
    for (const piece of pieceKey) {
      const needMove: { from: TNotation; to: TNotation }[] = [];
      const squares = pieces[piece as TPiece] ? pieces[piece as TPiece] : [];
      const activePool = this.activePiecesPool[piece as TPiece];
      const checkedSquares: Set<TNotation> = new Set();
      const usedSquares: Set<TNotation> = new Set();

      for (let i = 0; i < squares.length; i++) {
        const square = squares[i];
        const find = activePool.get(square);
        if (find) {
          usedSquares.add(square);
          checkedSquares.add(square);
        }
      }

      const create: TNotation[] = [];
      const keys = Array.from(activePool.keys());
      let k = 0;
      for (let i = 0; i < squares.length; i++) {
        const square = squares[i];
        if (usedSquares.has(square)) continue;

        while (k < keys.length) {
          const key = keys[k++];
          if (!key) continue;
          if (checkedSquares.has(key)) continue;

          needMove.push({ from: key, to: square });
          checkedSquares.add(key);
          usedSquares.add(square);
          break;
        }
      }

      for (let i = 0; i < squares.length; i++) {
        const square = squares[i];
        if (usedSquares.has(square)) continue;
        create.push(square);
      }

      const moveToInactive: Set<TNotation> = new Set();
      for (const key of keys) {
        if (checkedSquares.has(key)) continue;
        moveToInactive.add(key);
      }
      this.updateBoardPieces(needMove, moveToInactive, create, piece as TPiece);
    }
    this.createBoard();
  }

  private createBoard() {
    const board: Record<TNotation, TPieceBoard> = {} as Record<
      TNotation,
      TPieceBoard
    >;
    for (const [key, obj] of Object.entries(this.activePiecesPool)) {
      for (const o of obj.keys()) {
        const id = obj.get(o);
        if (!id) continue;
        const piece = this.piecesBoard.get(id);
        if (!piece) continue;
        board[o] = {
          id,
          square: piece.square,
          type: key as TPiece,
        };
      }
    }

    this.board = board;
  }

  private updateBoardPieces(
    needMove: { from: TNotation; to: TNotation }[],
    moveToInactive: Set<TNotation>,
    needCreate: TNotation[],
    type: TPiece
  ) {
    for (const obj of needMove) {
      const id = this.activePiecesPool[type].get(obj.from);
      if (!id) continue;
      this.activePiecesPool[type].delete(obj.from);
      this.activePiecesPool[type].set(obj.to, id);
      const curr = this.piecesBoard.get(id);
      if (!curr) continue;

      curr.square = {
        file: obj.to[0] as TFile,
        rank: parseInt(obj.to[1]) as TRank,
        notation: obj.to,
      };
    }

    for (const inactive of moveToInactive.values()) {
      const curr = this.activePiecesPool[type].get(inactive);
      if (!curr) continue;
      this.inactivePiecesPool[type].push(curr);
      this.activePiecesPool[type].delete(inactive);
      const piece = this.piecesBoard.get(curr);
      piece && (piece.square = null);
    }

    for (let i = 0; i < needCreate.length; i++) {
      const inactive = this.inactivePiecesPool[type].shift();
      if (!inactive) continue;
      const square = needCreate[i];
      this.activePiecesPool[type].set(square, inactive);

      const curr = this.piecesBoard.get(inactive);
      if (!curr) continue;

      curr.square = {
        file: square.charAt(0) as TFile,
        rank: parseInt(square.charAt(1)) as TRank,
        notation: square,
      };
    }
  }

  async refreshCanvases(canvases: Record<TCanvasLayer, boolean>) {
    await this.resetEvents(true);
    this.renderer.getLayerManager().setHoverEnabled(false);
    this.helpers.pieceHelper.clearCache();
    await this.initInternalRef();

    const render = (resolve: (value: void | PromiseLike<void>) => void) =>
      this.renderer.pipelineRender.setNextEvent(
        "onRender",
        [canvases],
        resolve
      );
    await Utils.asyncHandler(render);
    this.renderer.getLayerManager().setHoverEnabled(true);

    try {
      if (this.args.onUpdate) this.args.onUpdate();
    } catch (e) {
      console.log(e);
    }
  }

  async resetEvents(render: boolean) {
    let toRender = false;

    if (this.selected !== null) {
      if (this.selected.isDragging)
        this.helpers.pointerEventsHelper.endDrag(-1, -1, false, true);

      this.renderer.pipelineRender.setNextEvent("onPointerSelect", [
        null,
        true,
      ]);
      toRender = true;
    }

    if (this.pieceHover !== null) {
      this.renderer.pipelineRender.setNextEvent("onPointerHover", [null, true]);
      toRender = true;
    }

    if (!render || !toRender) return;
    const render_ = (resolve: (value: void | PromiseLike<void>) => void) =>
      this.renderer.pipelineRender.setNextEvent(
        "onRender",
        [
          {
            board: false,
            staticPieces: true,
            overlay: true,
            underlay: true,
            dynamicPieces: true,
          },
        ],
        resolve
      );

    await Utils.asyncHandler(render_);
  }

  updateBoard(piece: TPieceBoard) {
    if (!piece.square) return;
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

    if (!noRender)
      this.renderer.pipelineRender.setNextEvent("onRender", [
        {
          board: false,
          staticPieces: true,
          overlay: true,
          underlay: true,
          dynamicPieces: true,
        },
      ]);
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
    } else if (!noRender)
      this.renderer.pipelineRender.setNextEvent("onRender", [
        {
          board: false,
          staticPieces: true,
          overlay: true,
          underlay: true,
          dynamicPieces: true,
        },
      ]);
  }

  async setBlackView(b: boolean) {
    if (this.getIsBlackView() === b) return;
    this.args.isBlackView = b;
    this.setInternalRefObj({} as Record<TPieceId, TPieceInternalRef>);
    this.getCanvasLayers().clearAllRect();
    this.renderer.getLayerManager().resetAllLayers();
    await this.refreshCanvases({
      board: true,
      staticPieces: true,
      overlay: true,
      underlay: true,
      dynamicPieces: true,
    });
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
      this.renderer.pipelineRender.setNextEvent(
        "onRender",
        [
          {
            board: true,
            staticPieces: true,
            overlay: true,
            underlay: true,
            dynamicPieces: true,
          },
        ],
        resolve
      );
    });
  }

  async initPieceImages() {
    if (!this.args || !this.args.pieceStyle) {
      this.args.pieceStyle =
        this.helpers.pieceHelper.getPieceImages[this.args.pieceConfig?.type];
    }
    await this.loadImages();
  }

  async setPieceImages(type: "string" | "image") {
    if (this.destroyed || this.args.pieceConfig.type === type || this.isMoving)
      return;
    if (!this.isImagesLoaded && type === "image") await this.loadImages();
    this.args.pieceConfig.type = type;
    this.args.pieceStyle = this.helpers.pieceHelper.getPieceImages[type];

    const layerManager = this.renderer.getLayerManager();
    this.getCanvasLayers().clearAllRect({
      board: false,
      staticPieces: true,
      overlay: true,
      underlay: true,
      dynamicPieces: true,
    });
    layerManager.getLayer("staticPieces").redrawPieces();
    layerManager.getLayer("dynamicPieces").redrawPieces();

    await this.refreshCanvases({
      board: false,
      staticPieces: true,
      overlay: true,
      underlay: true,
      dynamicPieces: true,
    });
  }

  async updateBoardState(move: TMoveResult, delay: boolean) {
    const layerManager = this.renderer.getLayerManager();
    const moves = move;

    for (const move of moves) {
      const { from, to, promotion, captured } = move;
      let piece = this.board[move.from];
      const newSquare = {
        file: move.to.charAt(0) as TFile,
        rank: parseInt(move.to.charAt(1)) as TRank,
        notation: move.to,
      };

      //promotion
      if (promotion) {
        const newType = `${piece.type[0]}${promotion.toUpperCase()}` as TPiece;
        const newId = this.inactivePiecesPool[newType].shift();
        if (newId) {
          const newPiece = this.piecesBoard.get(newId);
          if (newPiece) {
            const ref: TPieceInternalRef = {
              square: delay ? piece.square : newSquare,
              type: newType,
              x: this.getInternalRefVal(piece.id).x,
              y: this.getInternalRefVal(piece.id).y,
            };

            this.setInternalRefVal(newId, ref);

            const layer = layerManager.getLayer("staticPieces");
            const piece_coords = layer.getCoords(piece.id);
            const coords = Utils.squareToCoords(
              newSquare,
              this.getSize() / 8,
              this.getIsBlackView()
            );

            piece.square = null;
            newPiece.square = newSquare;
            this.piecesBoard.set(piece.id, piece);
            this.inactivePiecesPool[piece.type].push(piece.id);
            this.activePiecesPool[piece.type].delete(move.from);
            this.activePiecesPool[newType].set(move.to, newPiece.id);
            this.piecesBoard.set(newId, newPiece);
            this.deleteIntervalRefVal(piece.id);

            layer.removeAll?.(piece.id);
            const newCoords = piece_coords
              ? piece_coords
              : coords
              ? {
                  x: coords.x,
                  y: coords.y,
                  w: this.getSize() / 8,
                  h: this.getSize() / 8,
                }
              : null;
            newCoords && layer.addAll?.(newId, ref, newCoords, newCoords);
            piece = newPiece;
          }
        }
      }

      // capture
      for (const cap of captured) {
        const enemie = this.board[cap];

        if (!enemie) continue;

        if (delay && this.getDefaultAnimation()) {
          layerManager.addDelayedPieceClear(piece.id, enemie.id);
        } else layerManager.getLayer("staticPieces").removeAll?.(enemie.id);

        if (enemie.square) {
          const inactive = this.activePiecesPool[enemie.type].get(
            enemie.square.notation
          );
          this.helpers.pieceHelper.removeCache(cap);
          this.activePiecesPool[enemie.type].delete(enemie.square.notation);
          inactive && this.inactivePiecesPool[enemie.type].push(inactive);

          const enemie_ = this.piecesBoard.get(enemie.id);
          enemie_ && (enemie_.square = null);
        }
        this.deleteIntervalRefVal(enemie.id);
      }

      // move piece
      if (!promotion) {
        piece.square = newSquare;
        this.activePiecesPool[piece.type].set(to, piece.id);
        this.piecesBoard.set(piece.id, piece);
      }
      this.activePiecesPool[piece.type].delete(from);
      this.board[to] = piece;
      delete this.board[from];

      const piece_ = this.getInternalRefVal(piece.id);
      this.helpers.pieceHelper.updateCache(from, to, {
        id: piece.id,
        piece: piece_,
      });
    }

    await this.refreshCanvases({
      board: false,
      staticPieces: true,
      overlay: true,
      underlay: true,
      dynamicPieces: true,
    });
  }

  async initInternalRef() {
    const squareSize = Math.floor(this.args.size / 8);
    const ids = Object.values(this.board);
    const layerManager = this.renderer.getLayerManager();
    this.renderer.getLayerManager().getLayer("staticPieces").clearPieces?.(ids);

    for (const piece of Object.values(this.board)) {
      const existing = this.internalRef[piece.id];

      if (existing && existing.square?.notation === piece.square?.notation)
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
      if (piece.square?.notation !== existing.square?.notation) {
        if (!this.getEvents()?.onDrawPiece && this.getDefaultAnimation()) {
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

        if (this.getDefaultAnimation())
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
