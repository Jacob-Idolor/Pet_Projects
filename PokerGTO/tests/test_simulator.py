import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import simulator


def test_deck_shuffle_changes_order():
    deck = simulator.Deck()
    original_order = deck.cards.copy()
    deck.shuffle()
    shuffled_order = deck.cards
    assert len(shuffled_order) == 52
    # ensure at least one card moved
    assert shuffled_order != original_order
    assert sorted(repr(c) for c in shuffled_order) == sorted(repr(c) for c in original_order)


def test_deal_hands_unique_cards():
    table = simulator.PokerTable(4)
    table.shuffle()
    players = table.deal_hands()
    dealt_cards = [card for p in players for card in p.hand]
    assert len(dealt_cards) == 8
    assert len(set(map(repr, dealt_cards))) == 8
    assert len(table.deck) == 52 - 8
