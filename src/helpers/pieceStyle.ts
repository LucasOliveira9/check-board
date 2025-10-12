import { TPieceDisplay, TPieceImage } from "src/types/piece.ts";

const imagesSrc = {
  wP: "assets/WhitePawn.svg",
  wB: "assets/WhiteBishop.svg",
  wN: "assets/WhiteKnight.svg",
  wR: "assets/WhiteRook.svg",
  wQ: "assets/WhiteQueen.svg",
  wK: "assets/WhiteKing.svg",
  bP: "assets/BlackPawn.svg",
  bB: "assets/BlackBishop.svg",
  bN: "assets/BlackKnight.svg",
  bR: "assets/BlackRook.svg",
  bQ: "assets/BlackQueen.svg",
  bK: "assets/BlackKing.svg",
};
const pieceStyle: Record<string, TPieceImage<TPieceDisplay>> = {
  string: {
    wK: "♔",
    wQ: "♕",
    wR: "♖",
    wB: "♗",
    wN: "♘",
    wP: "♙",
    bK: "♔",
    bQ: "♕",
    bR: "♖",
    bB: "♗",
    bN: "♘",
    bP: "♙",
  },
  image: (() => {
    const loadImage = (src: string) => {
      const image = new Image();
      image.src = src;
      return image;
    };
    return {
      wP: loadImage(imagesSrc["wP"]),
      wB: loadImage(imagesSrc["wB"]),
      wR: loadImage(imagesSrc["wR"]),
      wN: loadImage(imagesSrc["wN"]),
      wQ: loadImage(imagesSrc["wQ"]),
      wK: loadImage(imagesSrc["wK"]),
      bP: loadImage(imagesSrc["bP"]),
      bB: loadImage(imagesSrc["bB"]),
      bR: loadImage(imagesSrc["bR"]),
      bN: loadImage(imagesSrc["bN"]),
      bQ: loadImage(imagesSrc["bQ"]),
      bK: loadImage(imagesSrc["bK"]),
    };
  })(),
};

export default pieceStyle;
