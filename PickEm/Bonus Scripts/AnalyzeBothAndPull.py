import pandas as pd
import json
import matplotlib.pyplot as plt

# Load and prepare the CSV data
csv_file_path = 'nba_player_projections.csv'
player_projections_df = pd.read_csv(csv_file_path)

# Load and prepare the JSON data
json_file_path = 'player_game_logs_2023_2024.json'
with open(json_file_path, 'r') as file:
    game_logs_data = json.load(file)
game_logs_df = pd.DataFrame(game_logs_data)

# Aggregating the game log data
stats_to_aggregate = ['MIN', 'FGM', 'FGA', 'FG_PCT', 'FG3M', 'FG3A', 'FG3_PCT', 'FTM', 'FTA', 'FT_PCT', 'OREB', 'DREB', 'REB', 'AST', 'STL', 'BLK', 'TOV', 'PF', 'PTS']
aggregated_game_logs = game_logs_df.groupby('Player Name')[stats_to_aggregate].mean().reset_index()

# Adding combined stats to the aggregated game logs
def calculate_combined_stats(row, stat_types):
    return sum(row[stat] for stat in stat_types)

if 'Pts+Rebs' in player_projections_df['Stat Type'].values:
    aggregated_game_logs['Pts+Rebs'] = aggregated_game_logs.apply(lambda row: calculate_combined_stats(row, ['PTS', 'REB']), axis=1)
if 'Pts+Asts' in player_projections_df['Stat Type'].values:
    aggregated_game_logs['Pts+Asts'] = aggregated_game_logs.apply(lambda row: calculate_combined_stats(row, ['PTS', 'AST']), axis=1)
if 'Pts+Rebs+Asts' in player_projections_df['Stat Type'].values:
    aggregated_game_logs['Pts+Rebs+Asts'] = aggregated_game_logs.apply(lambda row: calculate_combined_stats(row, ['PTS', 'REB', 'AST']), axis=1)

# Define the combined stat types
combined_stat_types = ['Pts+Rebs', 'Pts+Asts', 'Pts+Rebs+Asts']

# Mapping stat types and merging data
stat_type_mapping = {
    'Points': 'PTS',
    '3-PT Made': 'FG3M',
    'Pts+Rebs': 'Pts+Rebs',
    'Pts+Asts': 'Pts+Asts',
    'Pts+Rebs+Asts': 'Pts+Rebs+Asts'
}
merged_df = pd.DataFrame()
for stat_type, column_name in stat_type_mapping.items():
    temp_df = player_projections_df[player_projections_df['Stat Type'] == stat_type]
    temp_merged = temp_df.merge(aggregated_game_logs[['Player Name', column_name]], on='Player Name', how='left')
    temp_merged['Actual Stat'] = temp_merged[column_name]
    temp_merged['Stat Type'] = stat_type
    merged_df = pd.concat([merged_df, temp_merged])

# Comparing projected and actual stats
merged_df['Difference'] = merged_df['Actual Stat'] - merged_df['Line Score']
merged_df.dropna(subset=['Actual Stat'], inplace=True)

# Display the first few rows of the merged dataframe with better formatting
print("Merged Dataframe Sample:")
print(merged_df.head())

# Analysis of performance with a function
def analyze_performance(dataframe):
    above_projection = len(dataframe[dataframe['Difference'] > 0])
    below_projection = len(dataframe[dataframe['Difference'] < 0])
    matched_projection = len(dataframe[dataframe['Difference'] == 0])
    return {
        'Above Projection': above_projection,
        'Below Projection': below_projection,
        'Matched Projection': matched_projection
    }

# Analysis for individual and combined stats
individual_stats_performance = analyze_performance(merged_df[~merged_df['Stat Type'].isin(combined_stat_types)])
combined_stats_performance = analyze_performance(merged_df[merged_df['Stat Type'].isin(combined_stat_types)])

# Function to plot the analysis
def plot_performance(performance, title):
    plt.bar(performance.keys(), performance.values())
    plt.title(title)
    plt.ylabel('Number of Instances')
    for index, value in enumerate(performance.values()):
        plt.text(index, value, str(value))
    plt.show()

# Plotting the analysis
print("\nIndividual Stats Performance:")
print(individual_stats_performance)
plot_performance(individual_stats_performance, "Individual Stats Performance")

print("\nCombined Stats Performance:")
print(combined_stats_performance)
plot_performance(combined_stats_performance, "Combined Stats Performance")
