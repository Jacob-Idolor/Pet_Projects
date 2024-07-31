import json
from nba_api.stats.endpoints import playergamelog

def get_player_game_logs(player_id, season='2023-24', num_games=5):
    try:
        # Query NBA API for player game logs
        game_logs = playergamelog.PlayerGameLog(player_id=player_id, season=season)

        # Get the API response content
        response_content = game_logs.get_dict()

        # Print the raw API response
        print(f"Raw API Response:\n{json.dumps(response_content, indent=2)}")

        # Check if the response contains the expected data
        if 'resultSets' in response_content and len(response_content['resultSets']) > 0:
            # Get the data frame containing game logs
            game_logs_data = game_logs.get_data_frames()[0]

            # Return the game logs as a list
            return game_logs_data.head(num_games).values.tolist()
        else:
            print(f"No game logs available. Unexpected API response format.")
    except Exception as e:
        print(f"Error retrieving game logs for player {player_id}: {e}")

    return []

if __name__ == "__main__":
    # Replace 'PLAYER_ID' with the actual NBA player ID you want to retrieve game logs for
    player_id_to_query = 'PLAYER_ID'
    
    # Replace 'SEASON' with the desired season (e.g., '2023-24')
    season_to_query = '2023-24'
    
    # Set the number of games to retrieve
    num_games_to_retrieve = 5
    
    player_game_logs = get_player_game_logs(player_id_to_query, season=season_to_query, num_games=num_games_to_retrieve)
    
    if player_game_logs is not None and len(player_game_logs) > 0:
        print(f"Game Logs for Player ID {player_id_to_query} (Season: {season_to_query}) - Retrieving {num_games_to_retrieve} games:")
        for game_log in player_game_logs:
            print(game_log)
    else:
        print("No game logs available.")
