package gemini

import (
	"context"
	"fmt"

	"google.golang.org/genai"

	"wordsGo_v2/slogger"
)

type Service interface {
	WordInfo(ctx context.Context, req Request) (string, error)
}

type service struct {
	client *genai.Client
	Model  string
}

func NewService(key string, model string) (Service, error) {
	client, err := genai.NewClient(context.Background(), &genai.ClientConfig{APIKey: key})
	if err != nil {
		return nil, fmt.Errorf("failed to create genai client: %w", err)
	}
	return &service{
		client: client,
		Model:  model,
	}, nil
}

const promptTemplate = `Ты — опытный преподаватель иностранных языков. 
Твоя задача — помочь ученику глубоко понять и выучить новое слово.

Язык ученика (язык объяснения): %[1]s.
Изучаемый язык: %[2]s.

Ученик встретил слово на изучаемом языке: "%[4]s".
Его перевод на язык ученика: "%[3]s".
Используй этот перевод, чтобы точно понять, в каком именно контексте и значении употребляется это слово.

Пожалуйста, предоставь детальную информацию об изучаемом слове по следующей структуре:
1. **Грамматика**: Часть речи, род, множественное число (для существительных), формы времени (для глаголов) и т.д.
2. **Нюансы употребления**: Тонкости перевода, формальность, синонимы.
3. **Примеры**: 3 примера использования в контексте (предложение на "%[2]s" -> перевод на "%[1]s").

Отвечай только на языке "%[1]s" (кроме самих примеров). Используй Markdown.`

func (s *service) WordInfo(ctx context.Context, req Request) (string, error) {

	promt := BuildGeminiPrompt(req)

	result, err := s.client.Models.GenerateContent(
		ctx,
		s.Model,
		genai.Text(promt),
		nil,
	)

	if err != nil {
		slogger.Log.ErrorContext(ctx, "Genai client response error", "error", err)
		return "", fmt.Errorf("failed to generate content: %w", err)
	}

	if result == nil || result.Text() == "" {
		return "", fmt.Errorf("no result")
	}

	slogger.Log.DebugContext(ctx, "Genai promt and  result", "promt", promt, "result", result)

	return result.Text(), nil
}
func BuildGeminiPrompt(req Request) string {
	// Я использую явную индексацию аргументов %[1]s, %[2]s и т.д.
	// Это крутая фича Go! Она позволяет передать аргумент один раз,
	// но использовать его в шаблоне несколько раз, не дублируя в коде.
	return fmt.Sprintf(
		promptTemplate,
		req.SourceLang, // %[1]s
		req.TargetLang, // %[2]s
		req.SourceWord, // %[3]s
		req.TargetWord, // %[4]s
	)
}
