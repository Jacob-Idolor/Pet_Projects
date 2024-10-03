package api

import (
	"encoding/json"
	"errors"
	"log"
	"os"

	"BallStats/models"

	"github.com/go-resty/resty/v2"
)

// FetchPlayers calls the BallDontLie API to fetch player data
func FetchPlayers() ([]models.Player, error) {
	apiKey := os.Getenv("BALDONTLIE_API_KEY")
	if apiKey == "" {
		return nil, errors.New("API Key not set in environment")
	}

	url := "https://api.balldontlie.io/v1/players"
	clientResty := resty.New()

	resp, err := clientResty.R().
		SetHeader("Content-Type", "application/json").
		SetHeader("Authorization", apiKey).
		Get(url)

	if err != nil {
		log.Fatal(err)
	}

	var apiResponse models.APIResponse
	err = json.Unmarshal(resp.Body(), &apiResponse)
	if err != nil {
		return nil, err
	}

	return apiResponse.Data, nil
}
