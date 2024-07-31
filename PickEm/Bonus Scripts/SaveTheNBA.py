import json
from tabulate import tabulate

def get_projection_info(projection, players_data):
    projection_info = {
        "rank": projection["attributes"]["rank"],
        "description": projection["attributes"]["description"],
        "line_score": projection["attributes"]["line_score"],
        "stat_type": projection["attributes"]["stat_type"],
        "new_player_id": projection.get("relationships", {}).get("new_player", {}).get("data").get("id"),
        "market": players_data.get(projection["relationships"]["new_player"]["data"]["id"]).get("attributes").get("market"),
        "name": players_data.get(projection["relationships"]["new_player"]["data"]["id"]).get("attributes").get("name"),
        "position": players_data.get(projection["relationships"]["new_player"]["data"]["id"]).get("attributes").get("position"),
        "team_name": players_data.get(projection["relationships"]["new_player"]["data"]["id"]).get("attributes").get("team_name"),
        "team_logo": players_data.get(projection["relationships"]["new_player"]["data"]["id"]).get("attributes").get("team_logo"),
        "player_headshot": players_data.get(projection["relationships"]["new_player"]["data"]["id"]).get("attributes").get("player_headshot"),
    }

    return projection_info

# Load JSON data from "dataset.json" with explicit UTF-8 encoding
with open("nbaonly.json", "r", encoding="utf-8") as file:
    data = json.load(file)

# Access specific elements in the JSON and find entries
if "data" in data and isinstance(data["data"], list):
    entries = data["data"]

    # Get the projection information for all entries
    projection_info = []

    # Load player details into a dictionary
    players_data = {}
    if "included" in data and isinstance(data["included"], list):
        included_data = data["included"]
        for item in included_data:
            if item["type"] == "new_player":
                player_id = item["id"]
                players_data[player_id] = item

    for entry in entries:
        projection_info.append(get_projection_info(entry, players_data))

    # Print the projection information to a text file
    with open("projection_infoNBA.txt", "w", encoding="utf-8") as file:
        for projection_info_entry in projection_info:
            file.write(f"{projection_info_entry}\n")
