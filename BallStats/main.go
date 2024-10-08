package main

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"strconv"
	"strings"

	"BallStats/api"
)

// Player struct and other functions remain the same

func main() {
	reader := bufio.NewReader(os.Stdin)

	fmt.Println("Welcome to the NBA Data Management System!")

	for {
		fmt.Println("\nPlease select an operation:")
		fmt.Println("1. Add Seasons Data")
		fmt.Println("2. Search Player")
		fmt.Println("3. Exit")
		fmt.Print("Enter your choice (1-3): ")

		choice, _ := reader.ReadString('\n')
		choice = strings.TrimSpace(choice)

		switch choice {
		case "1":
			addSeasonsPrompt(reader)
		case "2":
			searchPlayerPrompt(reader)
		case "3":
			fmt.Println("Thank you for using the NBA Data Management System. Goodbye!")
			return
		default:
			fmt.Println("Invalid choice. Please enter 1, 2, or 3.")
		}
	}
}

func searchPlayerPrompt(reader *bufio.Reader) {
	client, err := api.ConnectToMongoDB()
	if err != nil {
		fmt.Printf("Failed to connect to MongoDB: %v\n", err)
		return
	}
	defer client.Disconnect(context.Background())

	collection := client.Database("playerdata").Collection("players")

	playerNames, err := api.GetUniquePlayerNames(collection)
	if err != nil {
		fmt.Printf("Failed to fetch player names: %v\n", err)
		return
	}

	fmt.Println("Enter player name (type for suggestions, press Enter to finish):")
	input := ""
	for {
		char, _, err := reader.ReadRune()
		if err != nil {
			fmt.Println("Error reading input:", err)
			return
		}
		if char == '\n' {
			break
		}
		input += string(char)

		suggestions := getSuggestions(playerNames, input)
		if len(suggestions) > 0 {
			fmt.Printf("\nSuggestions: %s", strings.Join(suggestions[:min(5, len(suggestions))], ", "))
			fmt.Printf("\nCurrent input: %s", input)
		}
	}

	seasons, err := api.GetPlayerSeasons(collection, input)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	if len(seasons) == 0 {
		fmt.Printf("No data found for player: %s\n", input)
		return
	}

	fmt.Printf("\nPlayer: %s\n", seasons[0].PlayerName)
	fmt.Println("Seasons data:")
	for _, season := range seasons {
		fmt.Printf("\nSeason: %d\n", season.Season)
		fmt.Printf("Team: %s\n", season.Team)
		fmt.Printf("Age: %d\n", season.Age)
		fmt.Printf("Games Played: %d\n", season.Games)
		fmt.Printf("Minutes Played: %d\n", season.MinutesPlayed)
		fmt.Printf("PER: %.2f\n", season.PER)
		fmt.Printf("Win Shares: %.2f\n", season.WinShares)
		fmt.Printf("VORP: %.2f\n", season.VORP)
		// Add more stats as needed
	}

	// Add data analysis options here
	analyzePlayerData(seasons)
}

func getSuggestions(names []string, input string) []string {
	var suggestions []string
	lowercaseInput := strings.ToLower(input)
	for _, name := range names {
		if strings.HasPrefix(strings.ToLower(name), lowercaseInput) {
			suggestions = append(suggestions, name)
		}
	}
	return suggestions
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func analyzePlayerData(seasons []api.Player) {
	fmt.Println("\nData Analysis Options:")
	fmt.Println("1. Career Averages")
	fmt.Println("2. Best Season (by PER)")
	fmt.Println("3. Career Progression")
	fmt.Print("Enter your choice (1-3): ")

	reader := bufio.NewReader(os.Stdin)
	choice, _ := reader.ReadString('\n')
	choice = strings.TrimSpace(choice)

	switch choice {
	case "1":
		calculateCareerAverages(seasons)
	case "2":
		findBestSeason(seasons)
	case "3":
		showCareerProgression(seasons)
	default:
		fmt.Println("Invalid choice.")
	}
}

func calculateCareerAverages(seasons []api.Player) {
	var totalGames, totalMinutes int
	var totalPER, totalWinShares, totalVORP float64

	for _, season := range seasons {
		totalGames += season.Games
		totalMinutes += season.MinutesPlayed
		totalPER += season.PER * float64(season.Games)
		totalWinShares += season.WinShares
		totalVORP += season.VORP
	}

	avgPER := totalPER / float64(totalGames)
	avgMinutesPerGame := float64(totalMinutes) / float64(totalGames)

	fmt.Printf("\nCareer Averages:\n")
	fmt.Printf("Games Played: %.1f\n", float64(totalGames)/float64(len(seasons)))
	fmt.Printf("Minutes Per Game: %.1f\n", avgMinutesPerGame)
	fmt.Printf("PER: %.2f\n", avgPER)
	fmt.Printf("Win Shares Per Season: %.2f\n", totalWinShares/float64(len(seasons)))
	fmt.Printf("VORP Per Season: %.2f\n", totalVORP/float64(len(seasons)))
}

func findBestSeason(seasons []api.Player) {
	bestSeason := seasons[0]
	for _, season := range seasons[1:] {
		if season.PER > bestSeason.PER {
			bestSeason = season
		}
	}

	fmt.Printf("\nBest Season (by PER):\n")
	fmt.Printf("Season: %d\n", bestSeason.Season)
	fmt.Printf("Team: %s\n", bestSeason.Team)
	fmt.Printf("Age: %d\n", bestSeason.Age)
	fmt.Printf("Games Played: %d\n", bestSeason.Games)
	fmt.Printf("Minutes Per Game: %.1f\n", float64(bestSeason.MinutesPlayed)/float64(bestSeason.Games))
	fmt.Printf("PER: %.2f\n", bestSeason.PER)
	fmt.Printf("Win Shares: %.2f\n", bestSeason.WinShares)
	fmt.Printf("VORP: %.2f\n", bestSeason.VORP)
}

func showCareerProgression(seasons []api.Player) {
	fmt.Println("\nCareer Progression:")
	fmt.Println("Season\tAge\tPER\tWin Shares\tVORP")
	for _, season := range seasons {
		fmt.Printf("%d\t%d\t%.2f\t%.2f\t\t%.2f\n", season.Season, season.Age, season.PER, season.WinShares, season.VORP)
	}
}

func addSeasonsPrompt(reader *bufio.Reader) {
	fmt.Println("\n--- Add Seasons Data ---")
	fmt.Println("This operation will fetch NBA player data for a range of seasons and add it to the database.")

	startYear := promptForYear(reader, "Enter start year (e.g., 2010): ")
	endYear := promptForYear(reader, "Enter end year (e.g., 2023): ")

	if startYear > endYear {
		fmt.Println("Error: Start year must be less than or equal to end year.")
		return
	}

	fmt.Printf("\nYou've chosen to add data for seasons from %d to %d.\n", startYear, endYear)
	fmt.Print("Do you want to proceed? (yes/no): ")
	confirm, _ := reader.ReadString('\n')
	confirm = strings.TrimSpace(strings.ToLower(confirm))

	if confirm != "yes" && confirm != "y" {
		fmt.Println("Operation cancelled.")
		return
	}

	fmt.Printf("Fetching and adding data for seasons %d to %d. This may take a while...\n", startYear, endYear)
	if err := api.AddSeasons(startYear, endYear); err != nil { // Change this line
		fmt.Printf("Error occurred while adding seasons: %v\n", err)
	} else {
		fmt.Println("Seasons data added successfully!")
	}
}

func promptForYear(reader *bufio.Reader, prompt string) int {
	for {
		fmt.Print(prompt)
		yearStr, _ := reader.ReadString('\n')
		year, err := strconv.Atoi(strings.TrimSpace(yearStr))
		if err != nil {
			fmt.Println("Invalid input. Please enter a valid year.")
			continue
		}
		return year
	}
}
