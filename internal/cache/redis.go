package cache

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"

	"wordsGo_v2/internal/config"
	"wordsGo_v2/slogger"
)

type Client struct {
	rdb       *redis.Client
	ttl       time.Duration
	available bool
}

type CacheRepositoryI interface {
	Set(ctx context.Context, key string, value interface{}) error
	Get(ctx context.Context, key string) (string, error)
	Del(ctx context.Context, key string) error
	Close() error
	ZAdd(ctx context.Context, key string, members ...redis.Z) error
	ZRange(ctx context.Context, key string, start int64, stop int64) ([]string, error)
	ZIncrBy(ctx context.Context, key string, incr float64, member string) error
}

func NewRedisClient(cfg config.Redis) (*Client, error) {
	rdb := redis.NewClient(&redis.Options{
		Addr: fmt.Sprintf("%s:%s", cfg.Host, cfg.Port),
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	available := true
	if err := rdb.Ping(ctx).Err(); err != nil {
		slogger.Log.Warn("failed to connect to redis", "error", err)
		available = false
	} else {
		slogger.Log.Info("connected to redis")
	}

	return &Client{
		rdb:       rdb,
		ttl:       cfg.TTL,
		available: available,
	}, nil
}

func (c *Client) Set(ctx context.Context, key string, value interface{}) error {
	if !c.available {
		return nil
	}
	return c.rdb.Set(ctx, key, value, c.ttl).Err()
}

func (c *Client) Get(ctx context.Context, key string) (string, error) {
	if !c.available {
		return "", redis.Nil
	}
	return c.rdb.Get(ctx, key).Result()
}

func (c *Client) Del(ctx context.Context, key string) error {
	if !c.available {
		return nil
	}
	return c.rdb.Del(ctx, key).Err()
}

func (c *Client) Close() error {
	return c.rdb.Close()
}

func (c *Client) ZAdd(ctx context.Context, key string, members ...redis.Z) error {
	if !c.available {
		return nil
	}
	return c.rdb.ZAdd(ctx, key, members...).Err()
}

func (c *Client) ZRange(ctx context.Context, key string, start int64, stop int64) ([]string, error) {
	if !c.available {
		return nil, nil
	}
	return c.rdb.ZRange(ctx, key, start, stop).Result()
}

func (c *Client) ZIncrBy(ctx context.Context, key string, incr float64, member string) error {
	if !c.available {
		return nil
	}
	return c.rdb.ZIncrBy(ctx, key, incr, member).Err()
}
