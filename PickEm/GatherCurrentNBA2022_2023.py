from nba_api.stats.endpoints import playergamelog
import pandas as pd
import json

# Initialize an empty DataFrame to store all player game logs
all_player_game_logs = pd.DataFrame()

# Retrieve a list of all active NBA players
from nba_api.stats.static import players
active_players = players.get_active_players()

# Create a dictionary to map player IDs to names
player_id_name_map = {player['id']: player['full_name'] for player in active_players}

# Loop through each player to get their game logs for the 2023-2024 season
for player in active_players:
    player_id = player['id']
    game_logs = playergamelog.PlayerGameLog(player_id=player_id, season='2022-23')
    player_logs_df = game_logs.get_data_frames()[0]

    # Add the player's name to the DataFrame
    player_logs_df['Player Name'] = player_id_name_map[player_id]
    
    # Append each player's game logs to the main DataFrame
    all_player_game_logs = pd.concat([all_player_game_logs, player_logs_df], ignore_index=True)

# Save the DataFrame to a JSON file
file_path = 'game_logs_2022_2023.json'
all_player_game_logs.to_json(file_path, orient='records')

# Confirming the file save
print("Player game logs for the 2022-2023 season have been saved to 'game_logs_2022_2023.json'")

# Validation Step: Read back the saved JSON file and check its format
try:
    with open(file_path, 'r') as file:
        data = json.load(file)
        print("JSON file read successfully. Here are a few entries:")
        print(json.dumps(data[:3], indent=4))  # Print first few entries in a pretty format
except json.JSONDecodeError:
    print("Error: The file is not in proper JSON format.")
except Exception as e:
    print(f"An error occurred: {e}")
