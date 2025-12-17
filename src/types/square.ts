type TFile = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
type TRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type TNotation = `${TFile}${TRank}`;

type TSquare = {
  file: TFile;
  rank: TRank;
  notation: TNotation;
} | null;

export type { TFile, TRank, TSquare, TNotation };
