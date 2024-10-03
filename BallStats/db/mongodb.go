package db

import (
	"context"
	"fmt"
	"log"

	"BallStats/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// ConnectMongoDB establishes a connection to MongoDB
func ConnectMongoDB() (*mongo.Client, *mongo.Collection) {
	clientOptions := options.Client().ApplyURI("mongodb://localhost:27017")
	client, err := mongo.Connect(context.TODO(), clientOptions)
	if err != nil {
		log.Fatal(err)
	}

	collection := client.Database("ballstats").Collection("players")
	return client, collection
}

// InsertPlayers inserts player data into the MongoDB collection
func InsertPlayers(collection *mongo.Collection, players []models.Player) error {
	for _, player := range players {
		_, err := collection.InsertOne(context.TODO(), bson.M{
			"id":         player.ID,
			"first_name": player.FirstName,
			"last_name":  player.LastName,
			"position":   player.Position,
			"height":     player.Height,
			"weight":     player.Weight,
			"jersey":     player.Jersey,
			"college":    player.College,
			"country":    player.Country,
			"team": bson.M{
				"id":           player.Team.ID,
				"conference":   player.Team.Conference,
				"division":     player.Team.Division,
				"city":         player.Team.City,
				"name":         player.Team.Name,
				"full_name":    player.Team.FullName,
				"abbreviation": player.Team.Abbreviation,
			},
		})
		if err != nil {
			return err
		}
	}
	return nil
}

// EmptyCollection removes all documents from the specified collection
func EmptyCollection(collection *mongo.Collection) error {
	_, err := collection.DeleteMany(context.TODO(), bson.M{})
	if err != nil {
		return fmt.Errorf("error emptying collection: %v", err)
	}
	return nil
}
