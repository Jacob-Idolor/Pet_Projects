package models

type Player struct {
	ID        int    `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Position  string `json:"position"`
	Height    string `json:"height"`
	Weight    string `json:"weight"`
	Jersey    string `json:"jersey_number"`
	College   string `json:"college"`
	Country   string `json:"country"`
	Team      Team   `json:"team"`
}

type Team struct {
	ID           int    `json:"id"`
	Conference   string `json:"conference"`
	Division     string `json:"division"`
	City         string `json:"city"`
	Name         string `json:"name"`
	FullName     string `json:"full_name"`
	Abbreviation string `json:"abbreviation"`
}

type APIResponse struct {
	Data []Player `json:"data"`
	Meta Meta     `json:"meta"`
}

type Meta struct {
	NextCursor int `json:"next_cursor"`
	PerPage    int `json:"per_page"`
}
