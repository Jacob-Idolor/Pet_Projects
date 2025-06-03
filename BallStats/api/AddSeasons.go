package main

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

type Player struct {
	ID         int      `json:"id" bson:"_id"`
	PlayerName string   `json:"playername" bson:"playername"`
	Position   string   `json:"position" bson:"position"`
	Seasons    []Season `json:"seasons" bson:"seasons"`
}

type Season struct {
	Age                int     `json:"age" bson:"age"`
	Games              int     `json:"games" bson:"games"`
	MinutesPlayed      int     `json:"minutesplayed" bson:"minutesplayed"`
	PER                float64 `json:"per" bson:"per"`
	TSPercent          float64 `json:"tspercent" bson:"tspercent"`
	ThreePAR           float64 `json:"threepar" bson:"threepar"`
	FTR                float64 `json:"ftr" bson:"ftr"`
	OffensiveRBPercent float64 `json:"offensiverbpercent" bson:"offensiverbpercent"`
	DefensiveRBPercent float64 `json:"defensiverbpercent" bson:"defensiverbpercent"`
	TotalRBPercent     float64 `json:"totalrbpercent" bson:"totalrbpercent"`
	AssistPercent      float64 `json:"assistpercent" bson:"assistpercent"`
	StealPercent       float64 `json:"stealpercent" bson:"stealpercent"`
	BlockPercent       float64 `json:"blockpercent" bson:"blockpercent"`
	TurnoverPercent    float64 `json:"turnoverpercent" bson:"turnoverpercent"`
	UsagePercent       float64 `json:"usagepercent" bson:"usagepercent"`
	OffensiveWS        float64 `json:"offensivews" bson:"offensivews"`
	DefensiveWS        float64 `json:"defensivews" bson:"defensivews"`
	WinShares          float64 `json:"winshares" bson:"winshares"`
	WinSharesPer48     float64 `json:"winsharesper" bson:"winsharesper"`
	OffensiveBox       float64 `json:"offensivebox" bson:"offensivebox"`
	DefensiveBox       float64 `json:"defensivebox" bson:"defensivebox"`
}

func FetchPlayerData(season int) ([]Player, error) {
	url := fmt.Sprintf("http://b8c40s8.143.198.70.30.sslip.io/api/PlayerDataAdvanced/season/%d", season)
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("HTTP request failed: %v", err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %v", err)
	}

	var players []Player
	if err := json.Unmarshal(body, &players); err != nil {
		return nil, fmt.Errorf("failed to parse JSON: %v", err)
	}

	return players, nil
}

func AddSeasons(startYear, endYear int) error {
	// MongoDB setup
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	client, err := mongo.Connect(ctx, options.Client().ApplyURI("mongodb://localhost:27017"))
	if err != nil {
		return fmt.Errorf("failed to connect to MongoDB: %v", err)
	}
	defer client.Disconnect(ctx)

	collection := client.Database("NBADB").Collection("NBAPlayers")

	for season := startYear; season <= endYear; season++ {
		log.Printf("Fetching data for season %d...", season)
		players, err := FetchPlayerData(season)
		if err != nil {
			log.Printf("Failed to fetch data for season %d: %v", season, err)
			continue
		}

		for _, player := range players {
                       filter := bson.M{"_id": player.ID}
			update := bson.M{"$set": bson.M{
				"playername": player.PlayerName,
				"position":   player.Position,
			},
				"$push": bson.M{"seasons": bson.M{"$each": player.Seasons}},
			}
			opts := options.Update().SetUpsert(true)

			_, err := collection.UpdateOne(ctx, filter, update, opts)
			if err != nil {
				log.Printf("Failed to upsert player %s: %v", player.PlayerName, err)
			}
		}

		log.Printf("Completed processing for season %d", season)
	}

	log.Println("Data insertion complete.")
	return nil
}
