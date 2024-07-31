from nba_api.stats.endpoints import commonteamroster
from nba_api.stats.static import teams
import pandas as pd

# Fetch all NBA teams
all_teams = teams.get_teams()

# Initialize an empty list to store all DataFrames
all_teams_roster_dfs = []

for team in all_teams:
    team_id = team['id']
    team_name = team['full_name']

    # Fetch the team roster for the current season
    team_roster = commonteamroster.CommonTeamRoster(season='2023-24', team_id=team_id)
    team_roster_df = team_roster.get_data_frames()[0]

    # Add a column for the team name for easier identification
    team_roster_df['Team'] = team_name

    # Append this team's roster DataFrame to the list
    all_teams_roster_dfs.append(team_roster_df)

# Concatenate all DataFrames in the list
all_teams_roster_df = pd.concat(all_teams_roster_dfs, ignore_index=True)

# Save the DataFrame to a CSV file
csv_file_path = 'nba_teams_roster_2023-24.csv'
all_teams_roster_df.to_csv(csv_file_path, index=False)

# Display the file path of the saved CSV
print(f"Saved roster data to {csv_file_path}")
