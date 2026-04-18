package middleware

import "net/http"

const MaxBodySize = 1024 * 1024 // 1MB

// LimitPayloadSize enforces a limit on the size of the request payload and responds with 413 if the limit is exceeded.
func LimitPayloadSize(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.ContentLength > MaxBodySize {
			http.Error(w, "Request Entity Too Large", http.StatusRequestEntityTooLarge)
			return
		}
		next.ServeHTTP(w, r)
	})
}
