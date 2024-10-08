package api // Change this from 'main' to 'api'

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Player represents the player data structure
type Player struct {
	ID                 int     `json:"id"`
	PlayerName         string  `json:"playerName"`
	Position           string  `json:"position"`
	Age                int     `json:"age"`
	Games              int     `json:"games"`
	MinutesPlayed      int     `json:"minutesPlayed"`
	PER                float64 `json:"per"`
	TSPercent          float64 `json:"tsPercent"`
	ThreePAR           float64 `json:"threePAR"`
	FTR                float64 `json:"ftr"`
	OffensiveRBPercent float64 `json:"offensiveRBPercent"`
	DefensiveRBPercent float64 `json:"defensiveRBPercent"`
	TotalRBPercent     float64 `json:"totalRBPercent"`
	AssistPercent      float64 `json:"assistPercent"`
	StealPercent       float64 `json:"stealPercent"`
	BlockPercent       float64 `json:"blockPercent"`
	TurnoverPercent    float64 `json:"turnoverPercent"`
	UsagePercent       float64 `json:"usagePercent"`
	OffensiveWS        float64 `json:"offensiveWS"`
	DefensiveWS        float64 `json:"defensiveWS"`
	WinShares          float64 `json:"winShares"`
	WinSharesPer       float64 `json:"winSharesPer"`
	OffensiveBox       float64 `json:"offensiveBox"`
	DefensiveBox       float64 `json:"defensiveBox"`
	Box                float64 `json:"box"`
	VORP               float64 `json:"vorp"`
	Team               string  `json:"team"`
	Season             int     `json:"season"`
	PlayerID           string  `json:"playerId"`
}

func FetchPlayerData(season int) ([]Player, error) {
	url := fmt.Sprintf("http://b8c40s8.143.198.70.30.sslip.io/api/PlayerDataAdvanced/season/%d", season)

	log.Printf("Attempting to fetch data from URL: %s", url)

	// Create a new request
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	// Add headers
	req.Header.Add("accept", "text/json")

	// Set a timeout for the HTTP client
	client := &http.Client{
		Timeout: time.Second * 30,
	}

	// Send the request
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("HTTP request failed: %v", err)
	}
	defer resp.Body.Close()

	// Check the status code
	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := ioutil.ReadAll(resp.Body)
		return nil, fmt.Errorf("unexpected status code: %d, body: %s", resp.StatusCode, string(bodyBytes))
	}

	// Read the body
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %v", err)
	}

	// Check if the body is empty
	if len(body) == 0 {
		return nil, fmt.Errorf("received empty response body")
	}

	log.Printf("Received response body of length: %d bytes", len(body))

	var players []Player
	if err := json.Unmarshal(body, &players); err != nil {
		log.Printf("Failed to parse JSON: %v", err)
		log.Printf("Response body snippet: %s", string(body[:min(len(body), 100)]))
		return nil, fmt.Errorf("failed to parse JSON: %v", err)
	}

	return players, nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func InsertPlayersToMongo(players []Player, collection *mongo.Collection) error {
	var docs []interface{}
	for _, player := range players {
		docs = append(docs, player)
	}
	_, err := collection.InsertMany(context.TODO(), docs)
	return err
}

func ValidateMongoConnection(client *mongo.Client) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return client.Ping(ctx, nil)
}

func CheckExistingData(collection *mongo.Collection) (bool, error) {
	count, err := collection.CountDocuments(context.TODO(), bson.M{})
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// AddSeasons function to be called from main.go
func AddSeasons(startYear, endYear int) error {
	// MongoDB setup
	clientOptions := options.Client().ApplyURI("mongodb://localhost:27017")
	client, err := mongo.Connect(context.TODO(), clientOptions)
	if err != nil {
		return fmt.Errorf("failed to connect to MongoDB: %v", err)
	}
	defer client.Disconnect(context.TODO())

	// Validate MongoDB connection
	if err := ValidateMongoConnection(client); err != nil {
		return fmt.Errorf("failed to validate MongoDB connection: %v", err)
	}

	collection := client.Database("playerdata").Collection("players")

	// Check for existing data
	hasExistingData, err := CheckExistingData(collection)
	if err != nil {
		return fmt.Errorf("failed to check for existing data: %v", err)
	}
	if hasExistingData {
		log.Println("Warning: The collection already contains data. Proceeding may add duplicate entries.")
	}

	// Fetch and insert data for each season
	for season := startYear; season <= endYear; season++ {
		log.Printf("Fetching data for season %d...", season)
		players, err := FetchPlayerData(season)
		if err != nil {
			log.Printf("Failed to fetch data for season %d: %v", season, err)
			continue
		}

		if len(players) == 0 {
			log.Printf("No players found for season %d. Skipping...", season)
			continue
		}

		log.Printf("Inserting %d players from season %d...", len(players), season)
		err = InsertPlayersToMongo(players, collection)
		if err != nil {
			log.Printf("Failed to insert data for season %d: %v", season, err)
		}
	}

	log.Println("Data insertion complete.")
	return nil
}
