import { TPieceBoard } from "../../types/piece";

interface BoardHandled {
  loadPosition(b: TPieceBoard[]): void;
  flip(): void;
  getBoard(): readonly TPieceBoard[] | null;
}

export type { BoardHandled };
