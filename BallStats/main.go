package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"

	"BallStats/api" // Add this import. Replace 'your_module_name' with your actual module name
)

// Player struct and other functions remain the same

func main() {
	reader := bufio.NewReader(os.Stdin)

	fmt.Println("Welcome to the NBA Data Management System!")

	for {
		fmt.Println("\nPlease select an operation:")
		fmt.Println("1. Add Seasons Data")
		fmt.Println("2. Exit")
		fmt.Print("Enter your choice (1-2): ")

		choice, _ := reader.ReadString('\n')
		choice = strings.TrimSpace(choice)

		switch choice {
		case "1":
			addSeasonsPrompt(reader)
		case "2":
			fmt.Println("Thank you for using the NBA Data Management System. Goodbye!")
			return
		default:
			fmt.Println("Invalid choice. Please enter 1 or 2.")
		}
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
