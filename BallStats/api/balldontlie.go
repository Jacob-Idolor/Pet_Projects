package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"

	"BallStats/models"

	"github.com/go-resty/resty/v2"
)

// FetchPlayers calls the BallDontLie API to fetch player data
func FetchPlayers() ([]models.Player, error) {
	apiKey := os.Getenv("BALDONTLIE_API_KEY")
	fmt.Println("API Key:", apiKey) // Debug: Print API key

	if apiKey == "" {
		return nil, errors.New("API Key not set in environment")
	}

	url := "https://api.balldontlie.io/v1/players"
	clientResty := resty.New()
	var allPlayers []models.Player
	cursor := 1

	for {
		resp, err := clientResty.R().
			SetHeader("Content-Type", "application/json").
			SetHeader("Authorization", apiKey).
			SetQueryParam("per_page", "100").
			SetQueryParam("cursor", fmt.Sprintf("%d", cursor)).
			Get(url)

		if err != nil {
			return nil, fmt.Errorf("error fetching players: %v", err)
		}

		// Debug: Print raw response
		fmt.Println("Raw response:", string(resp.Body()))

		var apiResponse models.APIResponse
		err = json.Unmarshal(resp.Body(), &apiResponse)
		if err != nil {
			return nil, fmt.Errorf("error unmarshaling response: %v\nRaw response: %s", err, string(resp.Body()))
		}

		allPlayers = append(allPlayers, apiResponse.Data...)

		if apiResponse.Meta.NextCursor == 0 {
			break
		}
		cursor = apiResponse.Meta.NextCursor
	}

	return allPlayers, nil
}
