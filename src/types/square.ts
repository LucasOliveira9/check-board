type TFile = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
type TRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

type TSquare = {
  file: TFile;
  rank: TRank;
  notation: `${TFile}${TRank}`;
  captured?: boolean;
};

export type { TFile, TRank, TSquare };
