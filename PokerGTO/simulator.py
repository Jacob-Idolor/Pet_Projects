import random
from dataclasses import dataclass
from typing import List

SUITS = ["Hearts", "Diamonds", "Clubs", "Spades"]
VALUES = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"]


@dataclass
class Card:
    value: str
    suit: str


@dataclass
class PlayerHand:
    name: str
    hand: List[Card]


class PokerTable:
    """Generate and deal random poker hands."""

    def __init__(self, num_players: int):
        if num_players < 2:
            raise ValueError("Poker table must have at least two players.")

        self.num_players = num_players
        self.deck = self._create_deck()

    def _create_deck(self) -> List[Card]:
        return [Card(value=value, suit=suit) for suit in SUITS for value in VALUES]

    def shuffle(self) -> None:
        random.shuffle(self.deck)

    def deal_hands(self) -> List[PlayerHand]:
        """Deal two-card hands to every player."""

        players: List[PlayerHand] = []
        for seat in range(1, self.num_players + 1):
            if len(self.deck) < 2:
                raise RuntimeError("Not enough cards to deal a full table")

            hand = [self.deck.pop(), self.deck.pop()]
            players.append(PlayerHand(name=f"Player {seat}", hand=hand))

        return players
