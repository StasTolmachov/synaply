package slogger

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"log/slog"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/fatih/color"
	"github.com/google/uuid"
)

type userIDCtxKey struct{}

var UserIDKey userIDCtxKey

type requestIDCtxKey struct{}

var RequestIDKey requestIDCtxKey

const LevelFatal = slog.Level(12)

var (
	Log        *slog.Logger
	LevelNames = map[slog.Leveler]string{
		LevelFatal: "FATAL",
	}
)

const maskedValue = "[REDACTED]"

var piiSubstrings = []string{
	"email", "password", "token", "auth",
	"secret", "invite", "code", "credit_card",
}

func isPII(key string) bool {
	lowerKey := strings.ToLower(key)
	for _, sub := range piiSubstrings {
		if strings.Contains(lowerKey, sub) {
			return true
		}
	}
	return false
}

func maskPII(key string, val any) any {
	if isPII(key) {
		return maskedValue
	}
	return val
}

func replacePIIAttr(groups []string, a slog.Attr) slog.Attr {
	if isPII(a.Key) {
		a.Value = slog.StringValue(maskedValue)
	}
	return a
}

type ContextHandler struct {
	slog.Handler
}

func (h ContextHandler) Handle(ctx context.Context, r slog.Record) error {
	if reqID, ok := ctx.Value(RequestIDKey).(string); ok {
		r.AddAttrs(slog.String(KeyRequestID, reqID))
	}
	if uID, ok := ctx.Value(UserIDKey).(uuid.UUID); ok && uID != uuid.Nil {
		r.AddAttrs(slog.String(KeyUserID, uID.String()))
	}
	return h.Handler.Handle(ctx, r)
}

type PrettyHandlerOptions struct {
	SlogOpts slog.HandlerOptions
}

type PrettyHandler struct {
	slog.Handler
	l *log.Logger
}

func NewPrettyHandler(out io.Writer, opts PrettyHandlerOptions) *PrettyHandler {
	return &PrettyHandler{
		Handler: slog.NewJSONHandler(out, &opts.SlogOpts),
		l:       log.New(out, "", 0),
	}
}

func MakeLogger(env string) {
	var baseHandler slog.Handler

	opts := slog.HandlerOptions{
		AddSource: true,
	}

	if env == "development" {
		opts.Level = slog.LevelDebug
		baseHandler = NewPrettyHandler(os.Stdout, PrettyHandlerOptions{SlogOpts: opts})
	} else {
		opts.Level = slog.LevelInfo
		opts.ReplaceAttr = replacePIIAttr
		baseHandler = slog.NewJSONHandler(os.Stdout, &opts)
	}

	Log = slog.New(ContextHandler{Handler: baseHandler})
	slog.SetDefault(Log)
}

func (h *PrettyHandler) Handle(ctx context.Context, r slog.Record) error {
	level := r.Level.String()
	if customLevelName, ok := LevelNames[r.Level]; ok {
		level = customLevelName
	}

	switch r.Level {
	case slog.LevelDebug:
		level = color.MagentaString(level)
	case slog.LevelInfo:
		level = color.GreenString(level + " ")
	case slog.LevelWarn:
		level = color.YellowString(level + " ")
	case slog.LevelError, LevelFatal:
		level = color.RedString(level)
	}

	fields := make(map[string]interface{}, r.NumAttrs())

	r.Attrs(func(a slog.Attr) bool {
		safeVal := maskPII(a.Key, a.Value.Any())
		if a.Key == "error" && a.Value.Any() != nil {
			if err, ok := a.Value.Any().(error); ok {
				fields[a.Key] = err.Error()
			} else {
				fields[a.Key] = safeVal
			}
		} else {
			fields[a.Key] = safeVal
		}
		return true
	})

	source := make(map[string]interface{})
	fs := runtime.CallersFrames([]uintptr{r.PC})
	frame, _ := fs.Next()
	source["file"] = filepath.Base(frame.File)
	source["line"] = frame.Line
	source["func"] = color.CyanString(filepath.Base(frame.Function))

	timeStr := color.GreenString(r.Time.Format(time.DateTime))
	msg := color.BlueString(r.Message)

	var extra string
	if len(fields) > 0 {
		b, err := json.MarshalIndent(fields, "", "  ")
		if err != nil {
			return err
		}
		extra = string(b)
	}

	h.l.Printf("%v | %v | %v | %v | %v:%v\n%v", timeStr, level, msg, source["func"], source["file"], source["line"], extra)
	return nil
}
