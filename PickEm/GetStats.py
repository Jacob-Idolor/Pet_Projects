import requests
import pandas as pd

# Define the base URL for the API
base_url = 'https://www.balldontlie.io/api/v1/'

# Define the function to fetch player stats for the last season
def fetch_player_stats(player_id, season):
    # Create an empty list to hold the game stats
    all_stats = []
    page = 1
    while True:
        # Make the request to the API
        response = requests.get(f'{base_url}stats', params={
            'player_ids[]': player_id,
            'season': season,
            'per_page': 100,
            'page': page
        })
        data = response.json()
        if not data['data']:
            break
        all_stats.extend(data['data'])
        page += 1
    return all_stats

# Function to check if a game is a triple-double
def is_triple_double(game):
    categories = [game['pts'], game['reb'], game['ast'], game['stl'], game['blk']]
    # Check if there are at least 3 categories with 10 or more
    return sum(1 for category in categories if category >= 10) >= 3

# Fetch stats for a specific player (replace player_id with actual player ID)
player_id = 237  # Example player ID (LeBron James)
season = 2022  # Last season

# Fetch player stats
player_stats = fetch_player_stats(player_id, season)

# Calculate triple-doubles
triple_doubles = [game for game in player_stats if is_triple_double(game)]

# Output the number of triple-doubles
print(f"Player {player_id} had {len(triple_doubles)} triple-doubles in the {season} season.")
