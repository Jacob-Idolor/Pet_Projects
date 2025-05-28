package db

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Season struct {
	SeasonYear         int     `bson:"season"`
	Age                int     `bson:"age"`
	Games              int     `bson:"games"`
	MinutesPlayed      int     `bson:"minutesplayed"`
	PER                float64 `bson:"per"`
	TSPercent          float64 `bson:"tspercent"`
	ThreePAr           float64 `bson:"threepar"`
	FTr                float64 `bson:"ftr"`
	OffensiveRBPercent float64 `bson:"offensiverbpercent"`
	DefensiveRBPercent float64 `bson:"defensiverbpercent"`
	TotalRBPercent     float64 `bson:"totalrbpercent"`
	AssistPercent      float64 `bson:"assistpercent"`
	StealPercent       float64 `bson:"stealpercent"`
	BlockPercent       float64 `bson:"blockpercent"`
	TurnoverPercent    float64 `bson:"turnoverpercent"`
	UsagePercent       float64 `bson:"usagepercent"`
	OffensiveWS        float64 `bson:"offensivews"`
	DefensiveWS        float64 `bson:"defensivews"`
	WinShares          float64 `bson:"winshares"`
	WinSharesPer48     float64 `bson:"winsharesper"`
	OffensiveBoxPlus   float64 `bson:"offensivebox"`
	DefensiveBoxPlus   float64 `bson:"defensivebox"`
	BoxPlusMinus       float64 `bson:"box"`
	VORP               float64 `bson:"vorp"`
	Team               string  `bson:"team"`
}

type Player struct {
	PlayerID   string   `bson:"playerid"`
	PlayerName string   `bson:"playername"`
	Position   string   `bson:"position"`
	Seasons    []Season `bson:"seasons"`
}

func CleanPlayers(dbName, collectionName string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := connectToMongoDB(ctx)
	if err != nil {
		return fmt.Errorf("failed to connect to MongoDB: %v", err)
	}
	defer client.Disconnect(ctx)

	collection := client.Database(dbName).Collection(collectionName)

	playerIDs, err := getDistinctPlayerIDs(ctx, collection)
	if err != nil {
		return fmt.Errorf("failed to get distinct player IDs: %v", err)
	}

	for _, playerID := range playerIDs {
		if err := processPlayer(ctx, collection, playerID); err != nil {
			log.Printf("Error processing player %s: %v", playerID, err)
		}
	}

	fmt.Println("MongoDB data cleanup complete!")
	return nil
}

func connectToMongoDB(ctx context.Context) (*mongo.Client, error) {
	clientOptions := options.Client().ApplyURI("mongodb://localhost:27017")
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, err
	}
	return client, nil
}

func getDistinctPlayerIDs(ctx context.Context, collection *mongo.Collection) ([]string, error) {
	var playerIDs []interface{}
	opts := options.Distinct()
	playerIDs, err := collection.Distinct(ctx, "playerid", bson.M{}, opts)
	if err != nil {
		return nil, err
	}

	// Convert []interface{} to []string
	stringPlayerIDs := make([]string, len(playerIDs))
	for i, v := range playerIDs {
		stringPlayerIDs[i] = v.(string)
	}

	return stringPlayerIDs, nil
}

func processPlayer(ctx context.Context, collection *mongo.Collection, playerID string) error {
	cursor, err := collection.Find(ctx, bson.M{"playerid": playerID})
	if err != nil {
		return err
	}
	defer cursor.Close(ctx)

	var playerData []bson.M
	if err = cursor.All(ctx, &playerData); err != nil {
		return err
	}

	if len(playerData) == 0 {
		return nil
	}

	player := createPlayerFromData(playerID, playerData)

	filter := bson.M{"playerid": player.PlayerID}
	update := bson.M{"$set": player}

	_, err = collection.UpdateOne(ctx, filter, update, options.Update().SetUpsert(true))
	return err
}

func createPlayerFromData(playerID string, playerData []bson.M) Player {
	player := Player{
		PlayerID:   playerID,
		PlayerName: playerData[0]["playername"].(string),
		Position:   playerData[0]["position"].(string),
	}

	for _, data := range playerData {
		season := createSeasonFromData(data)
		player.Seasons = append(player.Seasons, season)
	}

	return player
}

func createSeasonFromData(data bson.M) Season {
	return Season{
		SeasonYear:         data["season"].(int),
		Age:                data["age"].(int),
		Games:              data["games"].(int),
		MinutesPlayed:      data["minutesplayed"].(int),
		PER:                data["per"].(float64),
		TSPercent:          data["tspercent"].(float64),
		ThreePAr:           data["threepar"].(float64),
		FTr:                data["ftr"].(float64),
		OffensiveRBPercent: data["offensiverbpercent"].(float64),
		DefensiveRBPercent: data["defensiverbpercent"].(float64),
		TotalRBPercent:     data["totalrbpercent"].(float64),
		AssistPercent:      data["assistpercent"].(float64),
		StealPercent:       data["stealpercent"].(float64),
		BlockPercent:       data["blockpercent"].(float64),
		TurnoverPercent:    data["turnoverpercent"].(float64),
		UsagePercent:       data["usagepercent"].(float64),
		OffensiveWS:        data["offensivews"].(float64),
		DefensiveWS:        data["defensivews"].(float64),
		WinShares:          data["winshares"].(float64),
		WinSharesPer48:     data["winsharesper"].(float64),
		OffensiveBoxPlus:   data["offensivebox"].(float64),
		DefensiveBoxPlus:   data["defensivebox"].(float64),
		BoxPlusMinus:       data["box"].(float64),
		VORP:               data["vorp"].(float64),
		Team:               data["team"].(string),
	}
}
