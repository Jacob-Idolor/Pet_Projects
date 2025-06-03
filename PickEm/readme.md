# PickEm Workflow

This folder contains Python scripts for gathering NBA projection lines, cleaning and merging stats, and running analytics to inform your daily "Pick 'Em" choices.

## 1. Download PrizePicks lines
Fetch the current NBA projections and save them locally:

```bash
curl -o PrizePicksLines.json https://api.prizepicks.com/projections?league_id=7
```

## 2. Clean the raw lines
Use `CleanupLines.py` to extract player names, stat types and line scores into `PlayerProjections.csv`.

```bash
python CleanupLines.py
```

## 3. Gather NBA game logs
Download game logs for the current season with `GatherCurrentNBA.py`:

```bash
python GatherCurrentNBA.py
```
This produces `game_logs_2023_2024.json`. Run the other `GatherCurrentNBAYYYY_YYYY.py` scripts to collect previous seasons if desired.

## 4. Merge datasets
Combine projections, game logs, rosters and team info using `Mergetest.py`:

```bash
python Mergetest.py
```

A merged file called `final_combined_data.csv` (and a simplified `combined_data.csv` for modeling) will be created.

## 5. Check overlapping players
Identify names present in both the projections and the game logs with `ShowCommonPlayers.py`:

```bash
python ShowCommonPlayers.py
```

## 6. Run predictive analytics
Execute `predictive_model_script.py` to train a RandomForest model predicting whether each projection goes over its line. The script will print a classification report showing precision, recall and F1-score. It then outputs a table summarizing predicted over/under counts per player and stat type.

```bash
python predictive_model_script.py
```

Interpret the classification metrics to gauge model quality—higher precision and recall indicate better predictions. Use the aggregated prediction table to spot players with frequent predicted overs or unders.

## 7. Visualize and explore
Run `ShowMetheMoney.py` to explore the merged dataset with additional summaries and graphs. The script uses seaborn and matplotlib to display trends.

```bash
python ShowMetheMoney.py
```

A simple interactive interface for quick look-ups is provided via `Gui.py`:

```bash
python Gui.py
```

---
This workflow generates clean projection data, compiles multi-season stats and allows you to analyze and visualize potential picks.
