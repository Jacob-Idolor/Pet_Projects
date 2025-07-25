import csv
import json
import math
import argparse
from pathlib import Path
from collections import defaultdict

from simple_prediction_service import _float, compute_actual


def build_dataset(rows):
    features = []
    labels = []
    meta = []
    for row in rows:
        actual = compute_actual(row)
        if actual is None:
            continue
        line_score = _float(row.get("Line Score"))
        x = [
            line_score,
            _float(row.get("PTS")),
            _float(row.get("REB")),
            _float(row.get("AST")),
        ]
        y = 1 if actual > line_score else 0
        features.append(x)
        labels.append(y)
        meta.append((row.get("Player Name"), row.get("Stat Type")))
    return features, labels, meta


def logistic_train(X, y, lr=0.01, epochs=500):
    if not X:
        return [], 0.0
    weights = [0.0] * len(X[0])
    bias = 0.0
    for _ in range(epochs):
        for xi, yi in zip(X, y):
            z = bias + sum(w * x for w, x in zip(weights, xi))
            pred = 1.0 / (1.0 + math.exp(-z))
            error = pred - yi
            for j in range(len(weights)):
                weights[j] -= lr * error * xi[j]
            bias -= lr * error
    return weights, bias


def logistic_predict(X, weights, bias):
    preds = []
    for xi in X:
        z = bias + sum(w * x for w, x in zip(weights, xi))
        p = 1.0 / (1.0 + math.exp(-z))
        preds.append(p)
    return preds


def aggregate_predictions(meta, preds):
    results = defaultdict(lambda: {"player": None, "stat_type": None, "games": 0, "over": 0, "under": 0})
    for (player, stat), p in zip(meta, preds):
        entry = results[(player, stat)]
        entry["player"], entry["stat_type"] = player, stat
        entry["games"] += 1
        if p >= 0.5:
            entry["over"] += 1
        else:
            entry["under"] += 1
    for entry in results.values():
        games = entry["games"] or 1
        entry["over_pct"] = round(entry["over"] / games, 2)
    return list(results.values())


def load_data(csv_file):
    with open(csv_file, newline='', encoding='utf-8') as f:
        return list(csv.DictReader(f))


def main():
    parser = argparse.ArgumentParser(description="Train logistic model for over/under predictions")
    default_csv = Path(__file__).resolve().parent / 'combined_data.csv'
    parser.add_argument('--csv', default=str(default_csv))
    parser.add_argument('--output', default='ml_predictions.json')
    parser.add_argument('--epochs', type=int, default=500)
    args = parser.parse_args()

    rows = load_data(args.csv)
    X, y, meta = build_dataset(rows)
    weights, bias = logistic_train(X, y, epochs=args.epochs)
    preds = logistic_predict(X, weights, bias)
    results = aggregate_predictions(meta, preds)

    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
    print(f"Saved {len(results)} predictions to {args.output}")


if __name__ == '__main__':
    main()
