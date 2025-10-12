import { TFile, TRank, TSquare } from "../types/square.ts";

const files = "abcdefgh";
const squareToCoords = (
  square: TSquare | null,
  squareSize: number,
  isBlackView: boolean
) => {
  if (square) {
    const file = files.indexOf(square.file);
    const rank = square.rank - 1;
    if (!isBlackView) {
      return { x: file * squareSize, y: (7 - rank) * squareSize };
    }
    return { x: (7 - file) * squareSize, y: rank * squareSize };
  }
};

const coordsToSquare = (
  x: number,
  y: number,
  squareSize: number,
  isBlackView: boolean
): TSquare | null => {
  let file = Math.floor(x / squareSize);
  let rank = 7 - Math.floor(y / squareSize);
  if (file < 0 || file > 7 || rank < 0 || rank > 8) return null;
  if (isBlackView) {
    file = 7 - Math.floor(x / squareSize);
    rank = Math.floor(y / squareSize);
  }
  const file_ = files[file] as TFile, //toFile(files[file]),
    rank_ = (rank + 1) as TRank; //toRank(rank + 1);

  if (file_ && rank_)
    return { file: file_, rank: rank_, notation: `${file_}${rank_}` };
  return null;
};

const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
  const rect = e.currentTarget.getBoundingClientRect();

  return { offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
};

export { getCanvasCoords, coordsToSquare, files, squareToCoords };
