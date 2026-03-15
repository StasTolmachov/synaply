package cache

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"

	"wordsGo_v2/internal/config"
	"wordsGo_v2/slogger"
)

type Client struct {
	rdb *redis.Client
	ttl time.Duration
}

type CacheRepositoryI interface {
	Set(ctx context.Context, key string, value interface{}) error
	Get(ctx context.Context, key string) (string, error)
	Del(ctx context.Context, key string) error
	Close() error
}

func NewRedisClient(cfg config.Redis) (*Client, error) {
	rdb := redis.NewClient(&redis.Options{
		Addr: fmt.Sprintf("%s:%s", cfg.Host, cfg.Port),
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		slogger.Log.Warn("failed to connect to redis", "error", err)

	} else {
		slogger.Log.Info("connected to redis")
	}

	return &Client{
		rdb: rdb,
		ttl: cfg.TTL,
	}, nil
}

func (c *Client) Set(ctx context.Context, key string, value interface{}) error {
	return c.rdb.Set(ctx, key, value, c.ttl).Err()
}

func (c *Client) Get(ctx context.Context, key string) (string, error) {
	val, err := c.rdb.Get(ctx, key).Result()
	if errors.Is(err, redis.Nil) {
		return "", ErrCacheMiss
	}
	return val, err
}

func (c *Client) Del(ctx context.Context, key string) error {
	return c.rdb.Del(ctx, key).Err()
}

func (c *Client) Close() error {
	return c.rdb.Close()
}

var ErrCacheMiss = errors.New("cache miss")
