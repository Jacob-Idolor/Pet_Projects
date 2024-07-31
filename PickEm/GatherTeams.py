from nba_api.stats.endpoints import teaminfocommon
import pandas as pd
import json

# Create an empty list to store information for all NBA teams
all_teams_info = []

# Define a list of NBA team IDs
nba_team_ids = [
    1610612737, 1610612738, 1610612739, 1610612740, 1610612741, 1610612742,
    1610612743, 1610612744, 1610612745, 1610612746, 1610612747, 1610612748,
    1610612749, 1610612750, 1610612751, 1610612752, 1610612753, 1610612754,
    1610612755, 1610612756, 1610612757, 1610612758, 1610612759, 1610612760,
    1610612761, 1610612762, 1610612763, 1610612764, 1610612765, 1610612766
]

# Loop through each NBA team ID and retrieve information
for team_id in nba_team_ids:
    team_info = teaminfocommon.TeamInfoCommon(team_id=team_id)
    team_info_df = team_info.get_data_frames()[0]
    team_info_dict = team_info_df.to_dict(orient='records')[0]
    all_teams_info.append(team_info_dict)

# Save the collected information as a JSON file
with open('nba_teams_info.json', 'w') as json_file:
    json.dump(all_teams_info, json_file, indent=4)

print("NBA team information has been collected and saved as 'nba_teams_info.json'.")
