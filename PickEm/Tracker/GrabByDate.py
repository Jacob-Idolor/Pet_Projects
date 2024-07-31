import requests
import pandas as pd
from datetime import datetime, timedelta

def fetch_games(date, api_key):
    """Fetch all games on a specific date."""
    url = "https://api.balldontlie.io/v1/games"
    headers = {'Authorization': api_key}
    params = {
        'start_date': date,
        'end_date': date,
        'per_page': '100'  # Maximize results per page
    }
    response = requests.get(url, headers=headers, params=params)
    if response.status_code == 200:
        return response.json()['data']
    else:
        print(f"Failed to retrieve games on {date}: {response.text}")
        return []

def fetch_player_stats(game_ids, api_key, game_date):
    """Fetch player stats for each game ID provided, include the game date."""
    player_stats = []
    url = "https://api.balldontlie.io/v1/stats"
    headers = {'Authorization': api_key}
    for game_id in game_ids:
        params = {'game_ids[]': game_id}
        response = requests.get(url, headers=headers, params=params)
        if response.status_code == 200:
            daily_stats = response.json()['data']
            for stat in daily_stats:
                stat['Game Date'] = game_date  # Add game date to each stat
            player_stats.extend(daily_stats)
        else:
            print(f"Failed to retrieve player stats for game ID {game_id}: {response.text}")
    return player_stats

def clean_data(df):
    """Clean and reformat the DataFrame. Rename columns for clarity."""
    df['Player Name'] = df['player'].apply(lambda x: f"{x['first_name']} {x['last_name']}")
    df.drop(columns=['player', 'team', 'game'], inplace=True)
    return df

def clean_combined_data(df):
    """Further clean and organize the combined DataFrame."""
    df.rename(columns={'Player Name_x': 'Player Name'}, inplace=True)
    df.drop(columns=['Normalized Player Name', 'Player Name_y'], inplace=True)
    df.fillna({'Line Score': 'No Projection', 'Stat Type': 'No Projection'}, inplace=True)
    return df

def main():
    api_key = 'enter key here'
    all_data = []  # List to hold data from each day

    # Loop over the last 7 days
    for i in range(3):
        date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
        games = fetch_games(date, api_key)
        if games:
            game_ids = [game['id'] for game in games]
            stats = fetch_player_stats(game_ids, api_key, date)  # Include date in stats fetching
            if stats:
                df_stats = pd.DataFrame(stats)
                cleaned_stats = clean_data(df_stats)
                
                # Load projections, filter, and combine
                projections = pd.read_csv('PlayerProjections.csv')
                projections = projections[~projections['Player Name'].str.contains('+', regex=False)]
                projections['Normalized Player Name'] = projections['Player Name'].str.lower()
                cleaned_stats['Normalized Player Name'] = cleaned_stats['Player Name'].str.lower()
                
                combined_data = pd.merge(cleaned_stats, projections, on='Normalized Player Name', how='left')
                combined_cleaned_data = clean_combined_data(combined_data)
                all_data.append(combined_cleaned_data)
            else:
                print(f"No player stats available for {date}.")
        else:
            print(f"No games available on {date}.")

    # Combine all data into one DataFrame
    final_data = pd.concat(all_data, ignore_index=True)
    final_data.to_excel(f'Combined_NBA_Player_Stats_with_Projections.xlsx', index=False)
    print("Weekly combined data with projections saved successfully.")

if __name__ == "__main__":
    main()
