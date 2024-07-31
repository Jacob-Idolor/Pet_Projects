import json
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

def load_data_from_file(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)

def filter_included_data(data, data_type):
    return [item for item in data.get("included", []) if item["type"] == data_type]

def main():
    data = load_data_from_file("dataset.json")

    if "data" in data and isinstance(data["data"], list):
        entries = data["data"]

        players_data = {item["id"]: item for item in filter_included_data(data, "new_player")}

        projection_info = [get_projection_info(entry, players_data) for entry in entries]

        projection_info_lowest = sorted(projection_info, key=lambda x: x["rank"])
        projection_info_highest = sorted(projection_info, key=lambda x: x["rank"], reverse=True)

        lowest_6_projection_info = projection_info_lowest[:20]
        highest_6_projection_info = projection_info_highest[:20]

        print_projections("Lowest 6 Ranked Projections:", lowest_6_projection_info)
        print_projections("Highest 6 Ranked Projections:", highest_6_projection_info)

def print_projections(title, projection_info_list):
    print(title)
    table_rows = [[f"{key}: {value}" for key, value in entry.items()] for entry in projection_info_list]
    print(tabulate(table_rows, headers="keys", tablefmt="fancy_grid", stralign="left", numalign="right"))

if __name__ == "__main__":
    main()
