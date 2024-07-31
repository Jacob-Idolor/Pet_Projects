# %% Initialization Module
import pandas as pd
from nba_api.stats.endpoints import playercareerstats, teaminfocommon, scoreboard
from nba_api.stats.static import players, teams

# %% Utility Functions
def get_player_id(player_name):
    # Function to get player ID using player's name
    return players.find_players_by_full_name(player_name)[0]['id']

def get_team_id(team_name):
    # Function to get team ID using team's name
    return teams.find_teams_by_full_name(team_name)[0]['id']

# %% Data Retrieval Modules
def get_player_stats(player_name):
    # Retrieves player stats
    player_id = get_player_id(player_name)
    player_stats = playercareerstats.PlayerCareerStats(player_id=player_id)
    return player_stats.get_data_frames()[0]

def get_team_info(team_name):
    # Retrieves team info
    team_id = get_team_id(team_name)
    team_info = teaminfocommon.TeamInfoCommon(team_id=team_id)
    return team_info.get_data_frames()[0]

def get_live_scores():
    # Retrieves live game scores
    live_scores = scoreboard.ScoreBoard()
    return live_scores.get_data_frames()[0]

# %% Main Function with Interactive Interface
def main():
    while True:
        print("\nAvailable Commands:")
        print("1. player_stats [player name] - Get career statistics for a player")
        print("2. team_info [team name] - Get information about a team")
        print("3. live_scores - Get current live game scores")
        print("4. exit - Exit the program")
        print("Enter a command:")

        user_input = input().strip().split(' ', 1)
        command = user_input[0].lower()

        if command == "player_stats" and len(user_input) > 1:
            player_name = user_input[1]
            try:
                player_stats_df = get_player_stats(player_name)
                print(player_stats_df.head())
            except Exception as e:
                print(f"Error fetching player stats: {e}")

        elif command == "team_info" and len(user_input) > 1:
            team_name = user_input[1]
            try:
                team_info_df = get_team_info(team_name)
                print(team_info_df.head())
            except Exception as e:
                print(f"Error fetching team info: {e}")

        elif command == "live_scores":
            try:
                live_scores_df = get_live_scores()
                print(live_scores_df.head())
            except Exception as e:
                print(f"Error fetching live scores: {e}")

        elif command == "exit":
            print("Exiting program.")
            break

        else:
            print("Unrecognized command. Please try again.")

# Run the main function
if __name__ == "__main__":
    main()
