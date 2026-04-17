package database

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"synaply/internal/config"
)

func NewPostgres(ctx context.Context, config config.Postgres) (*pgxpool.Pool, error) {
	configPool, err := pgxpool.ParseConfig(config.URL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse URL config DB: %w", err)
	}

	//options
	configPool.MaxConns = config.MaxConns
	configPool.MinConns = config.MinConns

	pool, err := pgxpool.NewWithConfig(ctx, configPool)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to DB: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping to DB: %w", err)
	}

	return pool, nil
}
