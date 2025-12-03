import { TBaseCtx } from "types";
import { TBoardEventContext, TEvents } from "../../types/events";
import { TPieceInternalRef } from "../../types/piece";
import BoardRuntime from "../BoardRuntime/BoardRuntime";

class Iterators {
  ITERATORS: Record<TEvents, any> = {
    onPointerSelect: "defaultOnSelect",
    onPointerHover: "defaultOnHover",
    onPointerDragStart: null,
    onPointerDrag: null,
    onPointerDrop: null,
    onAnimationFrame: null,
    onDrawPiece: null,
    onDrawBoard: null,
    onDrawOverlay: null,
    onDrawUnderlay: null,
  };
  constructor(protected boardRuntime: BoardRuntime) {}

  destroy() {
    for (const key of Object.getOwnPropertyNames(this)) {
      (this as any)[key] = null;
    }
  }

  defaultOnSelect<T extends TBoardEventContext = TBoardEventContext>(args: T) {
    const { squareSize, x, y } = args;
    //canvas && (canvas.style.zIndex = "3");
    //const canvas = getCanvas;

    const drawSelect = (ctx: TBaseCtx) => {
      const SELECT_COLOR = "#ffc400ff";
      const SELECT_GLOW = "rgba(255, 196, 0, 0.75)";
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        x + squareSize / 2,
        y + squareSize / 2,
        squareSize * 0.35,
        0,
        Math.PI * 2
      );
      ctx.strokeStyle = SELECT_COLOR;
      ctx.lineWidth = 3;
      ctx.fillStyle = SELECT_GLOW;
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    };

    this.boardRuntime.renderer
      .getLayerManager()
      .getLayer("underlay")
      .drawEvent(drawSelect, "onPointerSelect");

    if ("clearCache" in args && typeof args["clearCache"] === "function")
      (args as any).clearCache();
  }

  defaultOnHover<T extends TBoardEventContext = TBoardEventContext>(args: T) {
    const { squareSize, piece, piecesImage } = args;
    const hoverConfig = this.boardRuntime.getHoverConfig();
    if (!piece) return;
    const image = piecesImage?.[piece.type];

    // highlight
    if (hoverConfig.highlight) {
      const drawHighlight = (ctx: TBaseCtx) => {
        ctx.save();

        ctx.shadowColor = "rgba(255, 204, 0, 0.8)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.lineWidth = 3.5;
        ctx.strokeStyle = "#ffcc00";
        ctx.lineJoin = "round";

        ctx.beginPath();
        ctx.strokeRect(
          piece.x + 1,
          piece.y + 1,
          squareSize - 2,
          squareSize - 2
        );

        ctx.restore();
      };

      this.boardRuntime.renderer
        .getLayerManager()
        .getLayer("overlay")
        .drawEvent(drawHighlight, "onPointerHover");
    }

    // scaling
    if (hoverConfig.scaling && piece) {
      const drawScaling = (ctx: TBaseCtx) => {
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;

        if (image instanceof HTMLImageElement)
          this.drawOnHoverHTML(
            image,
            ctx,
            piece,
            squareSize,
            hoverConfig.scaleAmount
          );
        else if (typeof image === "string")
          this.drawOnHoverText(
            image,
            ctx,
            piece,
            squareSize,
            hoverConfig.scaleAmount
          );
        ctx.restore();
      };

      this.boardRuntime.renderer
        .getLayerManager()
        .getLayer("overlay")
        .drawEvent(drawScaling, "onPointerHover");
    }

    if ("clearCache" in args && typeof args["clearCache"] === "function")
      (args as any).clearCache();
  }

  drawOnHoverHTML(
    image: HTMLImageElement,
    ctx: TBaseCtx,
    piece: TPieceInternalRef,
    squareSize: number,
    scale: number
  ) {
    if (image && image.complete && image.naturalWidth > 0) {
      ctx.drawImage(
        image,
        piece.x - (squareSize * (scale - 1)) / 2,
        piece.y - (squareSize * (scale - 1)) / 2,
        squareSize * scale,
        squareSize * scale
      );
    }
  }

  drawOnHoverText(
    image: string,
    ctx: TBaseCtx,
    piece: TPieceInternalRef,
    squareSize: number,
    scale: number
  ) {
    const image_ = image.length > 1 ? image[0] : image;
    ctx.save();
    ctx.fillStyle = piece.type[0] === "w" ? "#ffffffff" : "#000";
    ctx.font = `${squareSize * 0.8 * scale}px monospace`;
    let fontSize = squareSize * 0.8;
    ctx.font = `${fontSize}px monospace`;
    const textWidth = ctx.measureText(image_).width;
    if (textWidth > squareSize * 0.9) {
      fontSize *= (squareSize * 0.9) / textWidth;
      ctx.font = `${fontSize}px monospace`;
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(image_, piece.x + squareSize / 2, piece.y + squareSize / 2);
    ctx.restore();
    const padding = squareSize * 1.5;

    // DEBUG
    /*ctx.save();
    ctx.strokeStyle = "rgba(255,0,0,0.4)";
    ctx.strokeRect(
      piece.x + squareSize / 2 - textWidth / 2 - padding / 2,
      piece.y + squareSize / 2 - fontSize / 2 - padding / 2,
      textWidth + padding,
      fontSize + padding
    );
    ctx.restore();*/
  }

  drawOnHoverPath() {}
}
export default Iterators;
