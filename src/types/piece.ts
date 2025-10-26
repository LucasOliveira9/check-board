import { TSquare } from "./square";

type TColor = "w" | "b";
type TPieceUp = "P" | "R" | "N" | "B" | "Q" | "K";
type TPieceLower = "p" | "r" | "n" | "b" | "q" | "k";
type TPiece = `${TColor}${TPieceUp}`;
type TPieceCount =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 34
  | 37
  | 38
  | 39
  | 40
  | 41
  | 42
  | 43
  | 44
  | 45
  | 46
  | 47
  | 48
  | 49
  | 50
  | 51
  | 52
  | 53
  | 54
  | 55
  | 56
  | 57
  | 58
  | 59
  | 60
  | 61
  | 62
  | 63
  | 64;
type TPieceId = `${TPiece}${TPieceCount}`;
type TPieceBoard = {
  square: TSquare;
  type: TPiece;
  id: TPieceId;
};
const pieceKey = [
  "wP",
  "wB",
  "wR",
  "wN",
  "wQ",
  "wK",
  "bP",
  "bB",
  "bR",
  "bN",
  "bQ",
  "bK",
] as const;
type TPieceKey = (typeof pieceKey)[number];
type TPieceDisplay = string | HTMLImageElement;
type TPieceImage<T = unknown> = Record<TPieceKey, T>;

type TPieceInternalRef = {
  square: TSquare;
  type: TPiece;
  x: number;
  y: number;
  anim?: boolean;
};

export type {
  TPiece,
  TPieceBoard,
  TPieceImage,
  TPieceId,
  TPieceInternalRef,
  TPieceDisplay,
  TPieceKey,
};
