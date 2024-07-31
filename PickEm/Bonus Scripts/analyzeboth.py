import json
import pandas as pd

# Function to load a JSON file
def load_json(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)

# Function to recursively search for player names in a nested JSON structure
def find_player_names_in_nested_json(data):
    player_names = set()
    if isinstance(data, dict):
        for key, value in data.items():
            if key == 'name' and isinstance(value, str):
                player_names.add(value)
            else:
                player_names.update(find_player_names_in_nested_json(value))
    elif isinstance(data, list):
        for item in data:
            player_names.update(find_player_names_in_nested_json(item))
    return player_names

# Load the CSV data
csv_data = pd.read_csv('nba_player_projections.csv')  # Replace with your CSV file path

# Extract player names from nba_player_projections.csv
player_names_csv = set(csv_data['Player Name'])

# Load the JSON data
game_logs_data = load_json('player_game_logs_2023_2024.json')  # Replace with your JSON file path

# Extract player names from player_game_logs_2023_2024.json
player_names_game_logs = {entry['Player Name'] for entry in game_logs_data}

# Find common player names
common_player_names = player_names_csv.intersection(player_names_game_logs)

# Print common player names
print(common_player_names)
