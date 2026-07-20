import { Card, Rank, Suit } from "../game/types";

function cardImageSrc(suit: Suit, rank: Rank): string {
  return `/images/cards/${suit}_${rank}.png`;
}

function cornerLabel(rank: Rank): string {
  switch (rank) {
    case 1:
      return "A";
    case 3:
      return "3";
    case 5:
      return "5";
    case 7:
      return "7";
    case 11:
      return "S";
    case 12:
      return "C";
    case 13:
      return "R";
  }
}

export function PlayingCard({ card, selected, onClick }: { card: Card; selected?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      className={`playing-card${selected ? " playing-card--selected" : ""}`}
      onClick={onClick}
      disabled={!onClick}
    >
      <div className="playing-card-art">
        <img src={cardImageSrc(card.suit, card.rank)} alt={`${cornerLabel(card.rank)} de ${card.suit}`} draggable={false} />
      </div>
    </button>
  );
}

export function CardBack() {
  return (
    <div className="card-back">
      <img src="/images/cards/card_back.png" alt="" draggable={false} />
    </div>
  );
}
