from nba_api.stats.static import players
from nba_api.stats.endpoints import playerdashboardbyyearoveryear
import pandas as pd

# Fetching all players and filtering for current (active) NBA players
all_players = players.get_players()
current_players = [player for player in all_players if player['is_active']]

# Extracting player IDs for current players
player_ids = [player['id'] for player in current_players]

# Initializing an empty DataFrame to store all advanced metrics
all_players_metrics = pd.DataFrame()

# Looping over each current player ID to fetch their advanced metrics
for player_id in player_ids:
    try:
        player_metrics = playerdashboardbyyearoveryear.PlayerDashboardByYearOverYear(player_id=player_id)
        player_metrics_df = player_metrics.get_data_frames()[1]  # Adjust the index if necessary

        # Check if player_metrics_df is not empty
        if not player_metrics_df.empty:
            all_players_metrics = pd.concat([all_players_metrics, player_metrics_df])
        else:
            print(f"No data for player ID {player_id}")

        print("Still Alive " + str(player_id))
    except Exception as e:
        print(f"Error fetching data for player ID {player_id}: {e}")

# Saving the combined data to a CSV file
all_players_metrics.to_csv('NBA_Current_Players_Advanced_Metrics.csv', index=False)
