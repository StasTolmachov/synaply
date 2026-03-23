package deepl

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
)

type ServiceI interface {
	Translate(ctx context.Context, req Request) (*Response, error)
}

type Service struct {
	Key    string
	Url    string
	Client *http.Client
}

func NewService(key string, url string, client *http.Client) ServiceI {
	return &Service{
		Key:    key,
		Url:    url,
		Client: client,
	}
}

func (s *Service) Translate(ctx context.Context, req Request) (*Response, error) {

	jsonBody, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, s.Url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, err
	}

	// 3. Set headers as specified in your example
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "DeepL-Auth-Key "+s.Key)
	httpReq.Header.Set("User-Agent", "Synaply/1.0") // It is recommended to specify the name of your application

	resp, err := s.Client.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("deepl API error: received status code %d", resp.StatusCode)
	}

	var deepLResp Response
	if err := json.NewDecoder(resp.Body).Decode(&deepLResp); err != nil {
		return nil, err
	}

	if len(deepLResp.Translations) == 0 {
		return nil, errors.New("translations is empty")
	}

	return &deepLResp, nil
}
