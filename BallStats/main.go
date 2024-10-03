package main

import (
	"bufio"
	"fmt"
	"log"
	"os"
	"strings"

	"BallStats/api"
	"BallStats/db"
	"BallStats/fabric"
)

func main() {
	// Initialize MongoDB connection
	client, collection := db.ConnectMongoDB()
	defer client.Disconnect(nil)

	// Prompt user for action
	reader := bufio.NewReader(os.Stdin)
	fmt.Print("Do you want to fetch new data? (yes/no): ")
	response, _ := reader.ReadString('\n')
	response = strings.TrimSpace(strings.ToLower(response))

	if response == "yes" {
		// Fetch data from BallDontLie API
		players, err := api.FetchPlayers()
		if err != nil {
			log.Fatalf("Error fetching players: %v", err)
		}

		// Insert or update data in MongoDB
		err = db.InsertPlayers(collection, players)
		if err != nil {
			log.Fatalf("Error inserting/updating players: %v", err)
		}

		fmt.Println("Database updated with new player data!")
	} else {
		fmt.Println("Using existing data from the database.")
	}

	// Generate insights using Fabric
	insights, err := fabric.GeneratePlayerInsights(collection)
	if err != nil {
		log.Printf("Error generating insights: %v", err)
		return
	}

	fmt.Println("Fabric Insights:")
	fmt.Println(insights)
}
