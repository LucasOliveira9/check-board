import { TPieceBoard } from "../../types/piece";

interface BoardHandled {
  setBoard(b: TPieceBoard[]): void;
  setBlackView(b: boolean): void;
  getBoard(): TPieceBoard[] | null;
}

export type { BoardHandled };
