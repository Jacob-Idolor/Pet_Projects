import json
import pandas as pd
from tabulate import tabulate

def get_player_attributes(player_data):
    return player_data.get("attributes", {})

def get_projection_info(projection, players_data):
    player_id = projection["relationships"]["new_player"]["data"]["id"]
    player_attributes = get_player_attributes(players_data.get(player_id, {}))

    return {
        "rank": projection["attributes"]["rank"],
        "description": projection["attributes"]["description"],
        "line_score": projection["attributes"]["line_score"],
        "stat_type": projection["attributes"]["stat_type"],
        "new_player_id": player_id,
        "market": player_attributes.get("market"),
        "name": player_attributes.get("name"),
        "position": player_attributes.get("position"),
        "team_name": player_attributes.get("team_name"),
        "team_logo": player_attributes.get("team_logo"),
        "player_headshot": player_attributes.get("player_headshot"),
    }

def filter_included_data(data, data_type):
    return [item for item in data.get("included", []) if item["type"] == data_type]

def load_data_from_file(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)

def main():
    data = load_data_from_file("nbaonly.json")

    if "data" in data and isinstance(data["data"], list):
        entries = data["data"]

        players_data = {item["id"]: item for item in filter_included_data(data, "new_player")}

        projection_info = [get_projection_info(entry, players_data) for entry in entries]

        # Creating a new dataset with only player name, line score, and stat type
        new_dataset = []
        for info in projection_info:
            new_entry = {
                "Player Name": info["name"],
                "Line Score": info["line_score"],
                "Stat Type": info["stat_type"]
            }
            new_dataset.append(new_entry)

        # Converting to DataFrame and saving to CSV
        new_dataset_df = pd.DataFrame(new_dataset)
        csv_file_path = "nba_player_projections.csv"
        new_dataset_df.to_csv(csv_file_path, index=False)

        print(f"Saved new dataset to {csv_file_path}")

if __name__ == "__main__":
    main()
