package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"time"

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
	page := 1
	perPage := 100 // Maximum allowed per page

	for {
		resp, err := clientResty.R().
			SetHeader("Authorization", apiKey).
			SetQueryParam("per_page", fmt.Sprintf("%d", perPage)).
			SetQueryParam("page", fmt.Sprintf("%d", page)).
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

		if len(apiResponse.Data) < perPage {
			break
		}
		page++

		// Respect rate limit
		time.Sleep(2 * time.Second)
	}

	return allPlayers, nil
}
