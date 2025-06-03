package db

import (
    "reflect"
    "testing"

    "go.mongodb.org/mongo-driver/bson"
)

func TestCreateSeasonFromData(t *testing.T) {
    data := bson.M{
        "season":            2024,
        "age":               28,
        "games":             82,
        "minutesplayed":     2500,
        "per":               15.5,
        "tspercent":         0.55,
        "threepar":          0.4,
        "ftr":               0.3,
        "offensiverbpercent": 5.0,
        "defensiverbpercent": 10.0,
        "totalrbpercent":    7.5,
        "assistpercent":     20.5,
        "stealpercent":      1.5,
        "blockpercent":      0.6,
        "turnoverpercent":   12.0,
        "usagepercent":      15.0,
        "offensivews":       2.1,
        "defensivews":       1.2,
        "winshares":         3.3,
        "winsharesper":      0.1,
        "offensivebox":      1.0,
        "defensivebox":      -0.5,
        "box":               0.5,
        "vorp":              1.5,
        "team":              "LAL",
    }

    want := Season{
        SeasonYear:         2024,
        Age:                28,
        Games:              82,
        MinutesPlayed:      2500,
        PER:                15.5,
        TSPercent:          0.55,
        ThreePAr:           0.4,
        FTr:                0.3,
        OffensiveRBPercent: 5.0,
        DefensiveRBPercent: 10.0,
        TotalRBPercent:     7.5,
        AssistPercent:      20.5,
        StealPercent:       1.5,
        BlockPercent:       0.6,
        TurnoverPercent:    12.0,
        UsagePercent:       15.0,
        OffensiveWS:        2.1,
        DefensiveWS:        1.2,
        WinShares:          3.3,
        WinSharesPer48:     0.1,
        OffensiveBoxPlus:   1.0,
        DefensiveBoxPlus:   -0.5,
        BoxPlusMinus:       0.5,
        VORP:               1.5,
        Team:               "LAL",
    }

    got := createSeasonFromData(data)
    if !reflect.DeepEqual(got, want) {
        t.Errorf("got %+v, want %+v", got, want)
    }
}

func TestCreatePlayerFromData(t *testing.T) {
    playerData := []bson.M{
        {
            "playername":      "John Doe",
            "position":        "G",
            "season":          2024,
            "age":             28,
            "games":           82,
            "minutesplayed":   2500,
            "per":             15.5,
            "tspercent":       0.55,
            "threepar":        0.4,
            "ftr":             0.3,
            "offensiverbpercent": 5.0,
            "defensiverbpercent": 10.0,
            "totalrbpercent":  7.5,
            "assistpercent":   20.5,
            "stealpercent":    1.5,
            "blockpercent":    0.6,
            "turnoverpercent": 12.0,
            "usagepercent":    15.0,
            "offensivews":     2.1,
            "defensivews":     1.2,
            "winshares":       3.3,
            "winsharesper":    0.1,
            "offensivebox":    1.0,
            "defensivebox":    -0.5,
            "box":             0.5,
            "vorp":            1.5,
            "team":            "LAL",
        },
        {
            "playername":      "John Doe",
            "position":        "G",
            "season":          2025,
            "age":             29,
            "games":           80,
            "minutesplayed":   2400,
            "per":             16.0,
            "tspercent":       0.56,
            "threepar":        0.41,
            "ftr":             0.31,
            "offensiverbpercent": 5.5,
            "defensiverbpercent": 9.5,
            "totalrbpercent":  7.0,
            "assistpercent":   21.0,
            "stealpercent":    1.6,
            "blockpercent":    0.7,
            "turnoverpercent": 11.5,
            "usagepercent":    16.0,
            "offensivews":     2.2,
            "defensivews":     1.3,
            "winshares":       3.5,
            "winsharesper":    0.11,
            "offensivebox":    1.1,
            "defensivebox":    -0.4,
            "box":             0.6,
            "vorp":            1.6,
            "team":            "LAL",
        },
    }

    playerID := "123"
    got := createPlayerFromData(playerID, playerData)

    want := Player{
        PlayerID:   "123",
        PlayerName: "John Doe",
        Position:   "G",
        Seasons: []Season{
            createSeasonFromData(playerData[0]),
            createSeasonFromData(playerData[1]),
        },
    }

    if !reflect.DeepEqual(got, want) {
        t.Errorf("got %+v, want %+v", got, want)
    }
}

