
import pandas as pd

# Load Player Projections
player_projections_df = pd.read_csv('PickEm\PlayerProjections.csv')

# Load Current Season Game Logs
current_season_df = pd.read_json('PickEm\game_logs_2023_2024.json')

# Load Historical Game Logs and combine with current season
seasons = ['2018_2019', '2019_2020', '2020_2021', '2021_2022', '2022_2023']
historical_game_logs = [current_season_df] + [pd.read_json(f'PickEm\game_logs_{season}.json') for season in seasons]
all_game_logs = pd.concat(historical_game_logs, ignore_index=True)

# Merge Player Projections with Game Logs on Player Name
combined_df = pd.merge(player_projections_df, all_game_logs, on='Player Name', how='inner')

# Load NBA Team Rosters
team_rosters_df = pd.read_csv('PickEm\last_5_years.csv')

# Merge NBA Team Rosters with combined_df
combined_with_rosters = pd.merge(combined_df, team_rosters_df, left_on='Player Name', right_on='PLAYER', how='left')

# Load NBA Team Data
team_df = pd.read_json('PickEm\ALLTeams.json')

# Merge the above result with NBA Team Data
final_combined_data = pd.merge(combined_with_rosters, team_df, left_on='TeamID', right_on='TEAM_ID', how='left')

# Now, final_combined_data contains all merged information
import pandas as pd
import json
import seaborn as sns
import matplotlib.pyplot as plt
from wordcloud import WordCloud
# Load and prepare the CSV data (player projections)
csv_file_path = 'PickEm\PlayerProjections.csv'
player_projections_df = pd.read_csv(csv_file_path)

# Load and prepare the JSON data (game logs for current season)
json_file_path = 'PickEm\game_logs_2023_2024.json'
with open(json_file_path, 'r') as file:
    game_logs_data = json.load(file)
current_season_df = pd.DataFrame(game_logs_data)

# Load and prepare historical game log data
seasons = ['2018_2019', '2019_2020', '2020_2021', '2021_2022', '2022_2023']
historical_game_logs = [current_season_df]

for season in seasons:
    json_file_path = f'PickEm\game_logs_{season}.json'
    with open(json_file_path, 'r') as file:
        season_data = json.load(file)
    historical_game_logs.append(pd.DataFrame(season_data))

# Combine historical data with current season data
combined_game_logs = pd.concat(historical_game_logs, ignore_index=True)

# Load and prepare the NBA team data
team_data_path = 'PickEm\ALLTeams.json'
with open(team_data_path, 'r') as file:
    team_data = json.load(file)
team_df = pd.DataFrame(team_data)


# Load and prepare the NBA team rosters data (nba_team_rosters_last_5_years.csv)
team_rosters_csv_path = 'PickEm\last_5_years.csv'  # Replace with your file path
team_rosters_df = pd.read_csv(team_rosters_csv_path)


# Selecting relevant columns (adjust as needed)
relevant_columns = ['TEAM_ID', 'SEASON_YEAR', 'TEAM_CITY', 'TEAM_NAME', 'TEAM_ABBREVIATION',
                    'TEAM_CONFERENCE', 'TEAM_DIVISION', 'TEAM_CODE', 'TEAM_SLUG', 'W', 'L',
                    'PCT', 'CONF_RANK', 'DIV_RANK', 'MIN_YEAR', 'MAX_YEAR']
team_df = team_df[relevant_columns]

# Extracting the team abbreviation from the 'MATCHUP' field in the game log data
combined_game_logs['TEAM_ABBREVIATION'] = combined_game_logs['MATCHUP'].apply(lambda x: x.split(' vs. ')[0])

# Merging the team data with the game log data
full_data = pd.merge(combined_game_logs, team_df, on='TEAM_ABBREVIATION', how='left')

# Aggregating the game log data
stats_to_aggregate = ['MIN', 'FGM', 'FGA', 'FG_PCT', 'FG3M', 'FG3A', 'FG3_PCT', 'FTM', 'FTA', 'FT_PCT', 'OREB', 'DREB', 'REB', 'AST', 'STL', 'BLK', 'TOV', 'PF', 'PTS']
aggregated_game_logs = combined_game_logs.groupby('Player Name')[stats_to_aggregate].mean().reset_index()

# [Remaining part of the script]


# --- Combined with ShowMetheMoneyOLD.py ---

import pandas as pd
import json

# Load and prepare the CSV data (player projections)
csv_file_path = 'PickEm\PlayerProjections.csv'
player_projections_df = pd.read_csv(csv_file_path)

# Load and prepare the JSON data (game logs)
json_file_path = 'PickEm\game_logs_2023_2024.json'
with open(json_file_path, 'r') as file:
    game_logs_data = json.load(file)
game_logs_df = pd.DataFrame(game_logs_data)

# Aggregating the game log data
stats_to_aggregate = ['MIN', 'FGM', 'FGA', 'FG_PCT', 'FG3M', 'FG3A', 'FG3_PCT', 'FTM', 'FTA', 'FT_PCT', 'OREB', 'DREB', 'REB', 'AST', 'STL', 'BLK', 'TOV', 'PF', 'PTS']
aggregated_game_logs = game_logs_df.groupby('Player Name')[stats_to_aggregate].mean().reset_index()
# Adding combined stats calculations
if 'REB' in game_logs_df.columns and 'AST' in game_logs_df.columns:
    aggregated_game_logs['Rebs+Asts'] = aggregated_game_logs['REB'] + aggregated_game_logs['AST']
else:
    raise ValueError("Required columns for 'Rebs+Asts' calculation are missing.")

if 'BLK' in game_logs_df.columns and 'STL' in game_logs_df.columns:
    aggregated_game_logs['Blks+Stls'] = aggregated_game_logs['BLK'] + aggregated_game_logs['STL']
else:
    raise ValueError("Required columns for 'Blks+Stls' calculation are missing.")


# Adding combined stats to the aggregated game logs
aggregated_game_logs['Pts+Rebs'] = aggregated_game_logs['PTS'] + aggregated_game_logs['REB']
aggregated_game_logs['Pts+Asts'] = aggregated_game_logs['PTS'] + aggregated_game_logs['AST']
aggregated_game_logs['Pts+Rebs+Asts'] = aggregated_game_logs['PTS'] + aggregated_game_logs['REB'] + aggregated_game_logs['AST']

# Merging the projections with the aggregated game logs
merged_projections_game_logs = pd.merge(player_projections_df, aggregated_game_logs, left_on='Player Name', right_on='Player Name', how='left')

# Mapping the 'Stat Type' from projections to corresponding columns in aggregated game logs

# Update the stat_type_mapping to include all the unique stat types
stat_type_mapping = {
    '3-PT Made': 'FG3M',
    'Points': 'PTS',
    'Pts+Rebs': 'Pts+Rebs',
    'Pts+Asts': 'Pts+Asts',
    'Pts+Rebs+Asts': 'Pts+Rebs+Asts',
    'Rebounds': 'REB',
    'Blocked Shots': 'BLK',
    'Rebs+Asts': 'Rebs+Asts',
    'Blks+Stls': 'Blks+Stls',
    'Turnovers': 'TOV',
    'Steals': 'STL',
    'Assists': 'AST'
}

# Adding the actual stat values to the merged dataframe
for stat_type, column_name in stat_type_mapping.items():
    merged_projections_game_logs.loc[merged_projections_game_logs['Stat Type'] == stat_type, 'Actual Stat'] = merged_projections_game_logs[column_name]

# Calculating the difference between projected and actual stats
merged_projections_game_logs['Difference'] = merged_projections_game_logs['Actual Stat'] - merged_projections_game_logs['Line Score']

# Function to calculate underperformance frequencies by player and stat type
def calculate_underperformance_frequencies_by_player_and_stat(dataframe):
    frequencies = {}
    players = dataframe['Player Name'].unique()
    stat_types = stat_type_mapping.keys()
    
    for player in players:
        player_df = dataframe[dataframe['Player Name'] == player]
        for stat_type in stat_types:
            stat_df = player_df[player_df['Stat Type'] == stat_type]
            under_count = len(stat_df[stat_df['Difference'] < 0])
            if player not in frequencies:
                frequencies[player] = {}
            frequencies[player][stat_type] = {'Under': under_count}
    return frequencies

# Calculate underperformance frequencies for each player and stat type
player_stat_underperformance = calculate_underperformance_frequencies_by_player_and_stat(merged_projections_game_logs)

# Create a list of tuples containing player, stat_type, and their underperformance frequencies
player_stat_underperformance_list = []
for player, stat_data in player_stat_underperformance.items():
    for stat_type, freq in stat_data.items():
        under_count = freq['Under']
        player_stat_underperformance_list.append((player, stat_type, under_count))

# Sort the player-stat combinations by underperformance frequency in descending order
player_stat_underperformance_list.sort(key=lambda x: x[2], reverse=True)

# Choose six unique player-stat combinations with the highest underperformance frequency for your 6-leg parlay
selected_combinations = []
selected_players = set()
for player, stat_type, under_count in player_stat_underperformance_list:
    if len(selected_combinations) == 6:
        break
    if player not in selected_players:
        selected_players.add(player)
        selected_combinations.append((player, stat_type))

# # Display the selected player-stat combinations and their underperformance frequencies
# for player, stat_type in selected_combinations:
#     print(f"Selected Player: {player}, Stat Type: {stat_type}")

# Now, you have six unique player-stat combinations to consider for your 6-leg parlay, and you can decide whether to go "under" for each of them.

# Adding a column for 'Over/Under' recommendation based on 'Line Score' and 'Actual Stat'
merged_projections_game_logs['Over/Under Recommendation'] = merged_projections_game_logs.apply(
    lambda row: 'Over' if row['Actual Stat'] > row['Line Score'] else 'Under', axis=1
)

# Calculating frequencies of 'over' and 'under' for each player and stat type
frequency_df = merged_projections_game_logs.groupby(['Player Name', 'Stat Type', 'Over/Under Recommendation']).size().reset_index(name='Frequency')

# Splitting the DataFrame into 'over' and 'under'
over_df = frequency_df[frequency_df['Over/Under Recommendation'] == 'Over']
under_df = frequency_df[frequency_df['Over/Under Recommendation'] == 'Under']

# Sorting and selecting top six for 'over'
top_over = over_df.sort_values(by='Frequency', ascending=False).head(6)

# Sorting and selecting top six for 'under'
top_under = under_df.sort_values(by='Frequency', ascending=False).head(6)

# # Function to print the top six predictions
# def print_top_six(df, category):
#     print(f"\nTop Six {category} Predictions:")
#     for index, row in df.iterrows():
#         print(f"Player: {row['Player Name']}, Stat Type: {row['Stat Type']}, Frequency: {row['Frequency']}")

# # Printing top six 'over' predictions
# print_top_six(top_over, 'Over')

# # Printing top six 'under' predictions
# print_top_six(top_under, 'Under')

# Selecting best six predictions based on frequency (combining top over and under)
best_six_predictions = pd.concat([top_over.head(3), top_under.head(3)])

# Printing best six predictions
print("\nBest Six Predictions for Over/Under:")
for index, row in best_six_predictions.iterrows():
    recommendation = 'Over' if row['Over/Under Recommendation'] == 'Over' else 'Under'
    print(f"Player: {row['Player Name']}, Stat Type: {row['Stat Type']}, Recommendation: {recommendation}")

print()
print("Best Category to Pick Per Player")
# # Selecting top six predictions for all 'over'
# top_six_all_over = over_df.sort_values(by='Frequency', ascending=False).head(6)

# # Selecting top six predictions for all 'under'
# top_six_all_under = under_df.sort_values(by='Frequency', ascending=False).head(6)

# # Function to print the top six "all over" or "all under" predictions
# def print_top_six_all(df, category):
#     print(f"\nTop Six {category} Predictions:")
#     for index, row in df.iterrows():
#         print(f"Player: {row['Player Name']}, Stat Type: {row['Stat Type']}, Frequency: {row['Frequency']}")

# # Printing top six "all over" predictions
# print_top_six_all(top_six_all_over, 'All Over')

# # Printing top six "all under" predictions
# print_top_six_all(top_six_all_under, 'All Under')

# # Printing all predictions for Over/Under:
# for index, row in merged_projections_game_logs.iterrows():
#     recommendation = 'Over' if row['Actual Stat'] > row['Line Score'] else 'Under'
#     print(f"Player: {row['Player Name']}, Stat Type: {row['Stat Type']}, Recommendation: {recommendation}")

# Group the data by 'Player Name' and 'Stat Type'
grouped_df = merged_projections_game_logs.groupby(['Player Name', 'Stat Type', 'Over/Under Recommendation']).size().reset_index(name='Frequency')

# Filter the data for 'Over' and 'Under' recommendations
over_data = grouped_df[grouped_df['Over/Under Recommendation'] == 'Over']
under_data = grouped_df[grouped_df['Over/Under Recommendation'] == 'Under']

# Define a function to select the top recommendations with unique players
def select_top_recommendations(df, top_n):
    unique_players = set()
    selected_recommendations = []

    for index, row in df.iterrows():
        player = row['Player Name']
        stat_type = row['Stat Type']
        recommendation = row['Over/Under Recommendation']  # Update this to match your column name

        # Check if the player has already been selected
        if player not in unique_players:
            unique_players.add(player)
            selected_recommendations.append((player, stat_type, recommendation))
            
            # Break the loop when you have selected the top_n recommendations
            if len(selected_recommendations) == top_n:
                break

    return selected_recommendations

# Call the function to get the top 6 recommendations with unique players
top_six_recommendations = select_top_recommendations(grouped_df, 6)

# Print the selected recommendations
for player, stat_type, recommendation in top_six_recommendations:
    print(f"Player: {player}, Stat Type: {stat_type}, Recommendation: {recommendation}")

