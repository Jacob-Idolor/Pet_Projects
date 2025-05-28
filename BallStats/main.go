package main

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

// Player struct and other functions remain the same

func main() {
	reader := bufio.NewReader(os.Stdin)

	fmt.Println("Welcome to the NBA Data Management System!")

	for {
		fmt.Println("\nPlease select an operation:")
		fmt.Println("1. Check Database Connection")
		fmt.Println("2. Exit")
		fmt.Print("Enter your choice (1-2): ")

		choice, _ := reader.ReadString('\n')
		choice = strings.TrimSpace(choice)

		switch choice {
		case "1":
			checkDatabaseConnection()
		case "2":
			fmt.Println("Thank you for using the NBA Data Management System. Goodbye!")
			return
		default:
			fmt.Println("Invalid choice. Please enter 1 or 2.")
		}
	}
}

func checkDatabaseConnection() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Connect to MongoDB using the provided connection string
	client, err := mongo.Connect(ctx, options.Client().ApplyURI("mongodb://localhost:27017/"))
	if err != nil {
		fmt.Printf("Failed to create MongoDB client: %v\n", err)
		return
	}
	defer func() {
		if err = client.Disconnect(ctx); err != nil {
			fmt.Printf("Failed to disconnect from MongoDB: %v\n", err)
		}
	}()

	// Ping the database
	err = client.Ping(ctx, readpref.Primary())
	if err != nil {
		fmt.Printf("Failed to ping MongoDB: %v\n", err)
		return
	}

	fmt.Println("Successfully connected to MongoDB!")

	// List all databases
	dbNames, err := client.ListDatabaseNames(ctx, bson.D{})
	if err != nil {
		fmt.Printf("Failed to list databases: %v\n", err)
		return
	}

	fmt.Printf("Found %d databases:\n", len(dbNames))
	for _, dbName := range dbNames {
		fmt.Printf("- %s\n", dbName)

		// List collections for each database
		db := client.Database(dbName)
		collNames, err := db.ListCollectionNames(ctx, bson.D{})
		if err != nil {
			fmt.Printf("  Failed to list collections for %s: %v\n", dbName, err)
			continue
		}

		fmt.Printf("  Collections in %s:\n", dbName)
		for _, collName := range collNames {
			fmt.Printf("  - %s\n", collName)
		}
		fmt.Println()
	}

	// Check for playerdata and NBAPlayers specifically
	playerdataExists := false
	nbaPlayersExists := false

	for _, dbName := range dbNames {
		if dbName == "playerdata" {
			playerdataExists = true
			db := client.Database("playerdata")
			collNames, err := db.ListCollectionNames(ctx, bson.D{})
			if err != nil {
				fmt.Printf("Failed to list collections for playerdata: %v\n", err)
			} else {
				for _, collName := range collNames {
					if collName == "NBAPlayers" {
						nbaPlayersExists = true
						break
					}
				}
			}
			break
		}
	}

	if !playerdataExists {
		fmt.Println("Warning: playerdata database does not exist.")
	} else if !nbaPlayersExists {
		fmt.Println("Warning: NBAPlayers collection does not exist in playerdata.")
	} else {
		fmt.Println("playerdata database and NBAPlayers collection exist.")
	}

	// Print MongoDB server info
	serverStatus, err := client.Database("admin").RunCommand(ctx, bson.D{{Key: "serverStatus", Value: 1}}).DecodeBytes()
	if err != nil {
		fmt.Printf("Failed to get server status: %v\n", err)
	} else {
		version, _ := serverStatus.Lookup("version").StringValueOK()
		fmt.Printf("MongoDB version: %s\n", version)
	}
}
