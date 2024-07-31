import json
from tabulate import tabulate
from nba_api.stats.endpoints import playergamelog

def get_player_attributes(player_data):
    return player_data.get("attributes", {})

def get_projection_info(projection, players_data):
    player_id = projection["relationships"]["new_player"]["data"]["id"]
    player_attributes = get_player_attributes(players_data.get(player_id, {}))

    return {
        "rank": projection["attributes"]["rank"],
        "description": projection["attributes"]["description"],
        "line_score": projection["attributes"]["line_score"],
        "actual_performance": get_actual_performance(player_id),
        "new_player_id": player_id,
        "market": player_attributes.get("market"),
        "name": player_attributes.get("name"),
        "position": player_attributes.get("position"),
        "team_name": player_attributes.get("team_name"),
        "team_logo": player_attributes.get("team_logo"),
        "player_headshot": player_attributes.get("player_headshot"),
    }

def get_actual_performance(player_id):
    try:
        # Query NBA API for player game logs
        game_logs = playergamelog.PlayerGameLog(player_id=player_id, season='2023-24')  # Adjust the season as needed

        # Get the data frame containing game logs
        game_logs_data = game_logs.get_data_frames()[0]

        # Extract specific performance metrics (customize as needed)
        if not game_logs_data.empty:
            last_game = game_logs_data.iloc[-1]  # Assuming the last row is the most recent game
            actual_performance = {
    "GAME_DATE": last_game['GAME_DATE'],
    "MATCHUP": last_game['MATCHUP'],
    "WL": last_game['WL'],  # Win-Loss (W or L)
    
    # General Statistics
    "MIN": last_game['MIN'],  # Minutes
    "PTS": last_game['PTS'],  # Points
    "REB": last_game['REB'],  # Total Rebounds
    "AST": last_game['AST'],  # Assists
    "STL": last_game['STL'],  # Steals
    "BLK": last_game['BLK'],  # Blocks
    "TOV": last_game['TOV'],  # Turnovers
    "PF": last_game['PF'],    # Personal Fouls

    # Field Goal Statistics
    "FGM": last_game['FGM'],      # Field Goals Made
    "FGA": last_game['FGA'],      # Field Goals Attempted
    "FG_PCT": last_game['FG_PCT'],  # Field Goal Percentage

    # Free Throw Statistics
    "FTM": last_game['FTM'],      # Free Throws Made
    "FTA": last_game['FTA'],      # Free Throws Attempted
    "FT_PCT": last_game['FT_PCT'],  # Free Throw Percentage

    # Three-Point Statistics
    "FG3M": last_game['FG3M'],     # Three-Point Field Goals Made
    "FG3A": last_game['FG3A'],     # Three-Point Field Goals Attempted
    "FG3_PCT": last_game['FG3_PCT'],  # Three-Point Field Goal Percentage

    # Plus/Minus
    "PLUS_MINUS": last_game['PLUS_MINUS'],

    # Additional Metrics (customize as needed)
    "DREB": last_game['DREB'],    # Defensive Rebounds
    "OREB": last_game['OREB'],    # Offensive Rebounds
    "DREB_PCT": last_game['DREB_PCT'],  # Defensive Rebound Percentage
    "OREB_PCT": last_game['OREB_PCT'],  # Offensive Rebound Percentage
    "AST_RATIO": last_game['AST_RATIO'],  # Assist Ratio
    "AST_TO": last_game['AST_TO'],    # Assist to Turnover Ratio

    # Game Score
    "GAME_SCORE": last_game['GAME_SCORE'],

    # Team Statistics
    "TEAM_ABBREVIATION": last_game['TEAM_ABBREVIATION'],  # Team Abbreviation (opponent)
    
    # ... Add more metrics as needed
}
            return actual_performance
        else:
            print(f"No game logs found for player {player_id}")
            return None
    except Exception as e:
        print(f"Error retrieving actual performance for player {player_id}: {e}")
        return None

def compare_line_score_with_actual(line_score, actual_performance):
    if actual_performance is not None:
        actual_points = actual_performance.get("PTS", 0)  # Default to 0 if "PTS" key is not present
        return "Over" if line_score > actual_points else "Under"
    else:
        return "Actual performance data not available"

def compare_projections_with_actual(title, projection_info_list):
    print(title)
    table_rows = []
    for entry in projection_info_list:
        line_score = entry["line_score"]
        actual_performance = entry["actual_performance"]
        comparison_result = compare_line_score_with_actual(line_score, actual_performance)
        
        table_rows.append([
            f"Projection Information: {entry}",
            f"Comparison Result: {comparison_result}"
        ])
    
    print(tabulate(table_rows, headers=["Projection Information", "Comparison Result"], tablefmt="fancy_grid", stralign="left", numalign="right"))

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

        projection_info_lowest = sorted(projection_info, key=lambda x: x["rank"])
        projection_info_highest = sorted(projection_info, key=lambda x: x["rank"], reverse=True)

        lowest_6_projection_info = projection_info_lowest[:20]
        highest_6_projection_info = projection_info_highest[:20]

        compare_projections_with_actual("Lowest 6 Ranked Projections:", lowest_6_projection_info)
        compare_projections_with_actual("Highest 6 Ranked Projections:", highest_6_projection_info)

if __name__ == "__main__":
    main()
