package api

import (
	"encoding/json"
	"fmt"

	"BallStats/models"

	"github.com/go-resty/resty/v2"
)

func FetchFreeRunPlayers() ([]models.Player, error) {
	url := "http://b8c40s8.143.198.70.30.sslip.io/index.html"
	clientResty := resty.New()
	var allPlayers []models.Player

	resp, err := clientResty.R().Get(url)
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

	return allPlayers, nil
}
