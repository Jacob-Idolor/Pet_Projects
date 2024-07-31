import pandas as pd

# Load Player Projections
player_projections_df = pd.read_csv('PickEm\\PlayerProjections.csv')

# Load Current Season Game Logs
current_season_df = pd.read_json('PickEm\\game_logs_2023_2024.json')

# Load Historical Game Logs and combine with current season
seasons = ['2018_2019', '2019_2020', '2020_2021', '2021_2022', '2022_2023']
historical_game_logs = [current_season_df] + [pd.read_json(f'PickEm\\game_logs_{season}.json') for season in seasons]
all_game_logs = pd.concat(historical_game_logs, ignore_index=True)

# Merge Player Projections with Game Logs on Player Name
combined_df = pd.merge(player_projections_df, all_game_logs, on='Player Name', how='inner')

# Load NBA Team Rosters
team_rosters_df = pd.read_csv('PickEm\\last_5_years.csv')

# Merge NBA Team Rosters with combined_df
combined_with_rosters = pd.merge(combined_df, team_rosters_df, left_on='Player Name', right_on='PLAYER', how='left')

# Load NBA Team Data
team_df = pd.read_json('PickEm\\ALLTeams.json')

# Merge the above result with NBA Team Data
final_combined_data = pd.merge(combined_with_rosters, team_df, left_on='TeamID', right_on='TEAM_ID', how='left')

# Save the final_combined_data dataframe to a CSV file
final_combined_data.to_csv('PickEm\\final_combined_data.csv', index=False)

# Now, final_combined_data contains all merged information and is saved as a CSV file
print(final_combined_data)
