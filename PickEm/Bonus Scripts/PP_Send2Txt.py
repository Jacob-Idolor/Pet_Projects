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

# Load JSON data from "dataset.json"
with open("dataset.json", "r", encoding="utf-8") as file:
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

        # Populate the projection_info list with data
        for entry in entries:
            projection_info_entry = get_projection_info(entry, players_data)
            projection_info.append(projection_info_entry)

        # Open a file for writing with explicit UTF-8 encoding
        with open("output.txt", "w", encoding="utf-8") as file:
            # Write the output to the file
            for projection_info_entry in projection_info:
                table_rows = []
                for key, value in projection_info_entry.items():
                    if key in ["team_logo", "player_headshot"]:
                        table_rows.append([value])
                    else:
                        table_rows.append([f"{key}: {value}"])

                # Use the default UTF-8 encoding
                output = tabulate(table_rows, headers="firstrow", tablefmt="fancy_grid")

                # Write the encoded output to the file
                file.write(output)
