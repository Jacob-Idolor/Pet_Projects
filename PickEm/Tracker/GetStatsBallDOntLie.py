import requests

# Define the base URL and your API key
base_url = 'https://api.balldontlie.io/v1/games/'
api_key = '98d4130f-00c8-4c6c-a1d1-4f9265dd24fd'
headers = {
    'Authorization': f'Bearer {api_key}'
}

# Function to get a specific game's data by ID
def get_game(game_id):
    url = f'{base_url}{game_id}'
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()['data']
    else:
        print(f"Failed to fetch game with ID {game_id}: {response.status_code}")
        print(f"Response Text: {response.text}")
        return None

# Example usage: Get details for a specific game (ID: 1)
game_id = 1
game_data = get_game(game_id)
if game_data:
    print(f"Game Details for ID {game_id}:")
    print(game_data)
