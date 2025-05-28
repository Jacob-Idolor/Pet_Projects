package db

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

func ConnectAndQueryMongoDB() {
	// MongoDB client setup
	client, err := mongo.NewClient(options.Client().ApplyURI("mongodb://localhost:27017"))
	if err != nil {
		log.Fatal(err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err = client.Connect(ctx)
	if err != nil {
		log.Fatal(err)
	}

	defer client.Disconnect(ctx)

	// Ping the database to ensure connection is established
	err = client.Ping(ctx, readpref.Primary())
	if err != nil {
		log.Fatal(err)
	}

	// Define the database and collection
	collection := client.Database("NBADB").Collection("players")

	// Query to find documents with playername or playerid
	filter := bson.D{
		{"$or", bson.A{
			bson.D{{"PlayerName", bson.D{{"$exists", true}}}},
			bson.D{{"PlayerID", bson.D{{"$exists", true}}}},
		}},
	}

	// Projection to return only PlayerName and PlayerID fields
	projection := bson.D{
		{"PlayerName", 1},
		{"PlayerID", 1},
		{"_id", 0}, // Exclude the _id field (optional)
	}

	opts := options.Find().SetProjection(projection)

	cursor, err := collection.Find(ctx, filter, opts)
	if err != nil {
		log.Fatal(err)
	}
	defer cursor.Close(ctx)

	// Iterate over the cursor and print the results
	for cursor.Next(ctx) {
		var result bson.M
		err := cursor.Decode(&result)
		if err != nil {
			log.Fatal(err)
		}
		fmt.Println(result)
	}

	if err := cursor.Err(); err != nil {
		log.Fatal(err)
	}
}
