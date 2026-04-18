package database

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"

	"synaply/internal/config"
)

func NewRedis(ctx context.Context, config config.Redis) (*redis.Client, error) {

	options, err := redis.ParseURL(config.URL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse redis url: %w", err)
	}

	client := redis.NewClient(options)

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to redis: %w", err)
	}
	return client, nil
}
