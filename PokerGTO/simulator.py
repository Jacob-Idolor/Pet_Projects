class Card:
    SUITS = ['Hearts', 'Diamonds', 'Clubs', 'Spades']
    VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']

    def __init__(self, value, suit):
        self.value = value
        self.suit = suit

    def __repr__(self):
        return f"{self.value}{self.suit[0]}"


class Deck:
    def __init__(self):
        self.cards = [Card(v, s) for s in Card.SUITS for v in Card.VALUES]

    def shuffle(self, rng=None):
        import random
        rand = rng or random
        rand.shuffle(self.cards)

    def deal_card(self):
        return self.cards.pop()

    def __len__(self):
        return len(self.cards)


class Player:
    def __init__(self, name):
        self.name = name
        self.hand = []

    def receive(self, card):
        self.hand.append(card)


class PokerTable:
    def __init__(self, num_players):
        self.deck = Deck()
        self.players = [Player(f"Player {i+1}") for i in range(num_players)]

    def shuffle(self, rng=None):
        self.deck.shuffle(rng)

    def deal_hands(self, cards_per_player=2):
        for _ in range(cards_per_player):
            for player in self.players:
                player.receive(self.deck.deal_card())
        return self.players
