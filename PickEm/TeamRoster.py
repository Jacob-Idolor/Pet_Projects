from nba_api.stats.static import teams
from nba_api.stats.endpoints import commonteamroster
import pandas as pd

# Get a list of all NBA teams and their IDs
nba_teams = teams.get_teams()
team_name_to_id = {team['full_name']: team['id'] for team in nba_teams}

# Define a list of seasons for the last 5 years
seasons = ['2018-19', '2019-20', '2020-21', '2021-22', '2022-23']

# Create an empty DataFrame to store the roster data
all_rosters = pd.DataFrame()

# Iterate through seasons and teams to fetch roster data
for season in seasons:
    for team_name, team_id in team_name_to_id.items():
        # Fetch the team roster for the current season and team
        team_roster = commonteamroster.CommonTeamRoster(season=season, team_id=team_id)
        roster_data = team_roster.get_data_frames()[0]
        
        # Add a 'Season' column to the DataFrame
        roster_data['Season'] = season
        roster_data['Team'] = team_name
        
        # Concatenate the roster data with the master DataFrame
        all_rosters = pd.concat([all_rosters, roster_data], ignore_index=True)

# Save the data to a CSV file
all_rosters.to_csv('nba_team_rosters_last_5_years.csv', index=False)

print("Data saved as 'nba_team_rosters_last_5_years.csv'.")
