package middleware

import (
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/redis/go-redis/v9"

	"synaply/internal/utils"
)

func RateLimiter(rdb *redis.Client, limit int64, duration time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()
			var key string

			//Extract the user from the context
			user, err := GetUserFromContext(ctx)
			if err == nil && user != nil {
				key = fmt.Sprintf("ratelimit:user:%s", user.ID.String())
			} else {
				clientIP := r.RemoteAddr
				key = fmt.Sprintf("ratelimit:ip:%s", clientIP)
			}

			//Increase count
			count, err := rdb.Incr(ctx, key).Result()
			if err != nil {
				slog.WarnContext(ctx, "RateLimiter: Redis is unreachable, bypassing limit", slog.String("error", err.Error()))
				next.ServeHTTP(w, r)
				return
			}

			if count == 1 {
				rdb.Expire(ctx, key, duration)
			}

			//Extract the TTL to send the wait duration to the frontend.
			var remainingSeconds int
			ttl, err := rdb.TTL(ctx, key).Result()
			if err != nil {
				slog.WarnContext(ctx, "RateLimiter: failed to get TTL, using default duration", slog.String("error", err.Error()))
				remainingSeconds = int(duration.Seconds())
			} else {
				remainingSeconds = int(ttl.Seconds())
				if remainingSeconds < 0 {
					remainingSeconds = int(duration.Seconds())
				}
			}

			//Send message if the time limit is exceeded
			if count > limit {
				slog.WarnContext(ctx, "Rate limit exceeded", slog.String("key", key))
				w.Header().Set("Retry-After", fmt.Sprintf("%d", remainingSeconds))
				utils.WriteError(w, http.StatusTooManyRequests, "Too many requests. Please try again later.")
				return
			}
			next.ServeHTTP(w, r)

		})
	}
}
