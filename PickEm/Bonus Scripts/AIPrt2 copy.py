import json
from tabulate import tabulate
from nba_api.stats.endpoints import playergamelog

def get_player_attributes(player_data):
    return player_data.get("attributes", {})

def get_projection_info(projection, players_data):
    player_id = projection["relationships"]["new_player"]["data"]["id"]
    player_attributes = get_player_attributes(players_data.get(player_id, {}))

    actual_performance = get_player_game_logs(player_id)  # Get actual performance data

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
        "actual_performance": actual_performance,
    }

def get_player_game_logs(player_id, season='2023-24', num_games=5):
    try:
        # Query NBA API for player game logs
        game_logs = playergamelog.PlayerGameLog(player_id=player_id, season=season)

        # Get the API response content
        response_content = game_logs.get_dict()

        # Check if the response contains the expected data
        if 'resultSets' in response_content and len(response_content['resultSets']) > 0:
            # Get the data frame containing game logs
            game_logs_data = game_logs.get_data_frames()[0]

            # Return the game logs as a list
            return game_logs_data.head(num_games).values.tolist()
        else:
            print(f"No game logs available. Unexpected API response format for player {player_id}.")
    except Exception as e:
        print(f"Error retrieving game logs for player {player_id}: {e}")

    return []

def load_data_from_file(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)

def filter_included_data(data, data_type):
    return [item for item in data.get("included", []) if item["type"] == data_type]

def main():
    data = load_data_from_file("nbaonly.json")

    if "data" in data and isinstance(data["data"], list):
        entries = data["data"]

        players_data = {item["id"]: item for item in filter_included_data(data, "new_player")}

        projection_info = [get_projection_info(entry, players_data) for entry in entries]

        print_projections("All Projections:", projection_info)

def print_projections(title, projection_info_list):
    print(title)
    table_rows = [[f"{key}: {value}" for key, value in entry.items()] for entry in projection_info_list]
    print(tabulate(table_rows, headers="keys", tablefmt="fancy_grid", stralign="left", numalign="right"))

if __name__ == "__main__":
    main()
