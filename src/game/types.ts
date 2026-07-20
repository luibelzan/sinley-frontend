export type Suit = "oros" | "copas" | "espadas" | "bastos";
export type Rank = 1 | 3 | 5 | 7 | 11 | 12 | 13;

export interface Card {
  suit: Suit;
  rank: Rank;
}

export type GamePhase =
  | "waiting"
  | "dealing_initial"
  | "betting_1"
  | "dealing_second"
  | "betting_2"
  | "discard"
  | "betting_final"
  | "showdown"
  | "finished";

export type PlayerAction =
  | { type: "pass" }
  | { type: "bet"; amount: number }
  | { type: "call" }
  | { type: "raise"; amount: number }
  | { type: "fold" };

export interface DiscardAction {
  cardIndexes: number[];
}

export interface HandEvaluation {
  tier: "sin_ley_real" | "sin_ley" | "suit_score";
  score: number;
  scoringSuit: Suit | null;
  scoringCards: Card[];
  handTypeLabel: string;
}

export interface PayoutEntry {
  playerId: string;
  amount: number;
}

export interface HandResult {
  payouts: PayoutEntry[];
  pot: number;
  evaluations: Record<string, HandEvaluation>;
  reason: "showdown" | "fold" | "instant_flush";
}

export interface PlayerPublicView {
  id: string;
  folded: boolean;
  allIn: boolean;
  currentRoundBet: number;
  totalContributed: number;
  cardCount: number;
  hand?: Card[];
}

export interface HandPublicState {
  phase: GamePhase;
  pot: number;
  currentBetToMatch: number;
  actingPlayerId: string | null;
  dealerId: string | null;
  result: HandResult | null;
  players: PlayerPublicView[];
}

export interface TableStateMessage {
  tableId: string;
  capacity: number;
  buyInCents: number;
  seatOrder: string[];
  connectedUserIds: string[];
  stacks: Record<string, number>;
  dealerId: string | null;
  hand: HandPublicState | null;
  seatUsernames: { id: string; username: string }[];
}

/** Salas disponibles: deben coincidir exactamente con las del backend (tableManager.ts). */
export const ROOM_CAPACITIES = [2, 3, 4] as const;
export const BUY_IN_TIERS_EUROS = [1, 2, 4, 5, 8, 10, 20, 25, 50, 100, 250] as const;

export const PHASE_LABELS: Record<GamePhase, string> = {
  waiting: "Esperando",
  dealing_initial: "Repartiendo",
  betting_1: "Primera ronda de apuestas",
  dealing_second: "Repartiendo cartas adicionales",
  betting_2: "Segunda ronda de apuestas",
  discard: "Descarte",
  betting_final: "Ronda final de apuestas",
  showdown: "Mostrando cartas",
  finished: "Mano terminada",
};

export function rankLabel(rank: Rank): string {
  switch (rank) {
    case 1:
      return "As";
    case 3:
      return "3";
    case 5:
      return "5";
    case 7:
      return "7";
    case 11:
      return "Sota";
    case 12:
      return "Caballero";
    case 13:
      return "Rey";
  }
}

export function suitLabel(suit: Suit): string {
  switch (suit) {
    case "oros":
      return "Oros";
    case "copas":
      return "Copas";
    case "espadas":
      return "Espadas";
    case "bastos":
      return "Bastos";
  }
}
