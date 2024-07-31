from nba_api.stats.endpoints import leaguegamefinder
import pandas as pd

def get_current_season_schedule():
    # Instantiate the LeagueGameFinder object
    game_finder = leaguegamefinder.LeagueGameFinder(season_nullable='2023-24')

    # Get the DataFrame of all games
    games_df = game_finder.get_data_frames()[0]

    # Return the DataFrame
    return games_df

# Function call to get the schedule
schedule_df = get_current_season_schedule()

# Save the DataFrame to a CSV file
schedule_df.to_csv('NBA_2022_23_Season_Schedule.csv', index=False)
