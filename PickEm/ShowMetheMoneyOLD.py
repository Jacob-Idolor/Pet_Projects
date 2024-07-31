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

# Display the selected player-stat combinations and their underperformance frequencies
for player, stat_type in selected_combinations:
    print(f"Selected Player: {player}, Stat Type: {stat_type}")

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

# Function to print the top six predictions
def print_top_six(df, category):
    print(f"\nTop Six {category} Predictions:")
    for index, row in df.iterrows():
        print(f"Player: {row['Player Name']}, Stat Type: {row['Stat Type']}, Frequency: {row['Frequency']}")

# Printing top six 'over' predictions
print_top_six(top_over, 'Over')

# Printing top six 'under' predictions
print_top_six(top_under, 'Under')

# Selecting best six predictions based on frequency (combining top over and under)
best_six_predictions = pd.concat([top_over.head(3), top_under.head(3)])

# Printing best six predictions
print("\nBest Six Predictions for Over/Under:")
for index, row in best_six_predictions.iterrows():
    recommendation = 'Over' if row['Over/Under Recommendation'] == 'Over' else 'Under'
    print(f"Player: {row['Player Name']}, Stat Type: {row['Stat Type']}, Recommendation: {recommendation}")

# Selecting top six predictions for all 'over'
top_six_all_over = over_df.sort_values(by='Frequency', ascending=False).head(6)

# Selecting top six predictions for all 'under'
top_six_all_under = under_df.sort_values(by='Frequency', ascending=False).head(6)

# Function to print the top six "all over" or "all under" predictions
def print_top_six_all(df, category):
    print(f"\nTop Six {category} Predictions:")
    for index, row in df.iterrows():
        print(f"Player: {row['Player Name']}, Stat Type: {row['Stat Type']}, Frequency: {row['Frequency']}")

# Printing top six "all over" predictions
print_top_six_all(top_six_all_over, 'All Over')

# Printing top six "all under" predictions
print_top_six_all(top_six_all_under, 'All Under')
