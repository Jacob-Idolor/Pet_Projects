package fabric

import (
	"context"
	"fmt"
	"os/exec"
	"strings"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

func GeneratePlayerInsights(collection *mongo.Collection) (string, error) {
	// Query the MongoDB collection to get player data
	cursor, err := collection.Find(context.TODO(), bson.M{})
	if err != nil {
		return "", fmt.Errorf("error querying MongoDB: %v", err)
	}
	defer cursor.Close(context.TODO())

	var players []map[string]interface{}
	if err = cursor.All(context.TODO(), &players); err != nil {
		return "", fmt.Errorf("error decoding player data: %v", err)
	}

	// Convert player data to a string for Fabric input
	playerData := ""
	for _, player := range players {
		playerData += fmt.Sprintf("Player: %v %v, Position: %v, Team: %v\n",
			player["first_name"], player["last_name"], player["position"], player["team"].(map[string]interface{})["full_name"])
	}

	// Use Fabric CLI to generate insights
	cmd := exec.Command("fabric", "-p", "analyze_nba_players", "-v", fmt.Sprintf("player_data=%s", playerData))
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("error running Fabric CLI: %v\nOutput: %s", err, string(output))
	}

	return strings.TrimSpace(string(output)), nil
}
