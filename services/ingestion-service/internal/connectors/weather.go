package connectors

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// WeatherCondition holds normalized METAR/TAF/SIGMET data from NOAA or EUROCONTROL.
type WeatherCondition struct {
	ICAO        string    `json:"icao"`          // Airport ICAO code
	ReportType  string    `json:"report_type"`   // METAR, TAF, SIGMET
	RawReport   string    `json:"raw_report"`
	Visibility  float64   `json:"visibility_m"`  // metres
	WindSpeed   float64   `json:"wind_speed_kt"` // knots
	WindDir     int       `json:"wind_dir_deg"`
	Ceiling     int       `json:"ceiling_ft"`    // lowest cloud layer in feet
	Temperature float64   `json:"temp_c"`
	DewPoint    float64   `json:"dewpoint_c"`
	Conditions  []string  `json:"conditions"`    // RA, SN, TS, FG, …
	Severity    string    `json:"severity"`      // NORMAL, CAUTION, WARNING, EXTREME
	ValidFrom   time.Time `json:"valid_from"`
	ValidTo     time.Time `json:"valid_to"`
	FetchedAt   time.Time `json:"fetched_at"`
}

// WeatherConnector fetches METAR/TAF data from the NOAA Aviation Weather Center API.
// For EUROCONTROL-airspace airports, the same REST endpoint works as EUROCONTROL
// mirrors the NOAA METAR feed. SIGMETs are fetched from the SIGMET API.
type WeatherConnector struct {
	BaseURL    string
	HTTPClient *http.Client
}

const defaultNOAABase = "https://aviationweather.gov/api/data"

func NewWeatherConnector(baseURL string) *WeatherConnector {
	if baseURL == "" {
		baseURL = defaultNOAABase
	}
	return &WeatherConnector{
		BaseURL:    baseURL,
		HTTPClient: &http.Client{Timeout: 10 * time.Second},
	}
}

// FetchMETAR retrieves the latest METAR for one or more ICAO codes.
func (w *WeatherConnector) FetchMETAR(ctx context.Context, icaoCodes []string) ([]WeatherCondition, error) {
	url := fmt.Sprintf("%s/metar?ids=%s&format=json&taf=false&hours=1",
		w.BaseURL, strings.Join(icaoCodes, ","))

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("weather metar request: %w", err)
	}

	resp, err := w.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("weather metar fetch: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("weather metar read: %w", err)
	}

	// NOAA METAR JSON response schema
	var raw []struct {
		ICAO      string  `json:"icaoId"`
		RawOb     string  `json:"rawOb"`
		Temp      float64 `json:"temp"`
		Dewp      float64 `json:"dewp"`
		Wdir      int     `json:"wdir"`
		Wspd      float64 `json:"wspd"`
		Visib     string  `json:"visib"`
		Ceil      int     `json:"ceil"`
		WxString  string  `json:"wxString"`
		ReportTime string `json:"reportTime"`
	}
	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, fmt.Errorf("weather metar unmarshal: %w", err)
	}

	results := make([]WeatherCondition, 0, len(raw))
	now := time.Now().UTC()
	for _, r := range raw {
		conditions := []string{}
		if r.WxString != "" {
			conditions = strings.Fields(r.WxString)
		}
		vis := parseVisibility(r.Visib)
		results = append(results, WeatherCondition{
			ICAO:       r.ICAO,
			ReportType: "METAR",
			RawReport:  r.RawOb,
			Visibility: vis,
			WindSpeed:  r.Wspd,
			WindDir:    r.Wdir,
			Ceiling:    r.Ceil,
			Temperature: r.Temp,
			DewPoint:   r.Dewp,
			Conditions: conditions,
			Severity:   classifySeverity(vis, r.Ceil, r.Wspd, conditions),
			ValidFrom:  now,
			ValidTo:    now.Add(1 * time.Hour),
			FetchedAt:  now,
		})
	}
	return results, nil
}

// FetchTAF retrieves the Terminal Aerodrome Forecast for a given airport.
func (w *WeatherConnector) FetchTAF(ctx context.Context, icao string) (*WeatherCondition, error) {
	url := fmt.Sprintf("%s/taf?ids=%s&format=json&metar=false", w.BaseURL, icao)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("weather taf request: %w", err)
	}
	resp, err := w.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("weather taf fetch: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var raw []struct {
		ICAO    string `json:"icaoId"`
		RawTAF  string `json:"rawTAF"`
		IssueTime string `json:"issueTime"`
	}
	if err := json.Unmarshal(body, &raw); err != nil || len(raw) == 0 {
		return nil, fmt.Errorf("weather taf unmarshal or empty: %w", err)
	}

	now := time.Now().UTC()
	return &WeatherCondition{
		ICAO:       raw[0].ICAO,
		ReportType: "TAF",
		RawReport:  raw[0].RawTAF,
		Severity:   "NORMAL",
		ValidFrom:  now,
		ValidTo:    now.Add(24 * time.Hour),
		FetchedAt:  now,
	}, nil
}

func parseVisibility(visib string) float64 {
	visib = strings.TrimSpace(visib)
	if visib == "" {
		return 9999
	}
	// NOAA sends "10+" for >10SM or numeric SM values
	visib = strings.TrimSuffix(visib, "+")
	var v float64
	fmt.Sscanf(visib, "%f", &v)
	return v * 1609.344 // SM → metres
}

func classifySeverity(visMetre float64, ceilFt int, windKt float64, conditions []string) string {
	for _, wx := range conditions {
		if strings.Contains(wx, "TS") || strings.Contains(wx, "FC") {
			return "EXTREME"
		}
	}
	if visMetre < 800 || ceilFt < 200 {
		return "EXTREME"
	}
	if visMetre < 1500 || ceilFt < 500 || windKt > 35 {
		return "WARNING"
	}
	if visMetre < 5000 || ceilFt < 1000 || windKt > 25 {
		return "CAUTION"
	}
	return "NORMAL"
}
