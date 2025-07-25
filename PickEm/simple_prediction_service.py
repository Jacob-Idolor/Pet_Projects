import csv
import json
import argparse
from pathlib import Path
from collections import defaultdict


def load_data(csv_file):
    with open(csv_file, newline='', encoding='utf-8') as f:
        return list(csv.DictReader(f))


def _float(value):
    try:
        return float(value)
    except (ValueError, TypeError):
        return 0.0


def compute_actual(row):
    stat = row.get("Stat Type", "")
    pts = _float(row.get("PTS"))
    reb = _float(row.get("REB"))
    ast = _float(row.get("AST"))

    if stat == "PTS":
        return pts
    if stat == "REB":
        return reb
    if stat == "AST":
        return ast
    if "Pts+Rebs+Asts" in stat or stat == "PRA":
        return pts + reb + ast
    if "Pts+Rebs" in stat:
        return pts + reb
    if "Pts+Asts" in stat:
        return pts + ast
    if "Rebs+Asts" in stat:
        return reb + ast
    return None


def aggregate_predictions(rows):
    results = defaultdict(lambda: {"player": None, "stat_type": None, "games": 0, "over": 0, "under": 0})
    for row in rows:
        actual = compute_actual(row)
        if actual is None:
            continue
        line_score = _float(row.get("Line Score"))
        key = (row.get("Player Name"), row.get("Stat Type"))
        entry = results[key]
        entry["player"], entry["stat_type"] = key
        entry["games"] += 1
        if actual > line_score:
            entry["over"] += 1
        else:
            entry["under"] += 1
    for entry in results.values():
        games = entry["games"] or 1
        entry["over_pct"] = round(entry["over"] / games, 2)
    return list(results.values())


def main():
    parser = argparse.ArgumentParser(description="Generate simple over/under predictions")
    default_csv = Path(__file__).resolve().parent / 'combined_data.csv'
    parser.add_argument('--csv', default=str(default_csv))
    parser.add_argument('--output', default='simple_predictions.json')
    args = parser.parse_args()

    rows = load_data(args.csv)
    results = aggregate_predictions(rows)

    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
    print(f"Saved {len(results)} predictions to {args.output}")


if __name__ == '__main__':
    main()
