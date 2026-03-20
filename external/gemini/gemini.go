package gemini

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"google.golang.org/genai"

	"wordsGo_v2/slogger"
)

type Service interface {
	WordInfo(ctx context.Context, req WordInfoRequest) (string, error)
	StartPracticeWithGemini(ctx context.Context, req *PracticeWithGemini, wordList string) (*StartPracticeWithGeminiResponse, error)
	CheckAnswerPracticeWithGemini(ctx context.Context, req *PracticeWithGemini, translate string) (*CheckAnswerPracticeWithGeminiResponse, error)
	WordList(ctx context.Context, req WordListReq) ([]WordListResp, error)
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

const WordInfoPromptTemplate = `Ты — опытный преподаватель иностранных языков. 
Твоя задача — помочь ученику глубоко понять и выучить новое слово.

Язык ученика (язык объяснения): %[1]s.
Изучаемый язык: %[2]s.

Ученик встретил слово на изучаемом языке: "%[4]s".
Его перевод на язык ученика: "%[3]s".
Используй этот перевод, чтобы точно понять, в каком именно контексте и значении употребляется это слово.

Пожалуйста, предоставь детальную информацию об изучаемом слове по следующей структуре:
1.**Произношение**: Напиши, как звучит слово "%[4]s", используя только буквы алфавита языка "%[1]s". Строго запрещено использовать международные знаки транскрипции. Пиши маленькими буквами, а ударную гласную обязательно выдели заглавной буквой.
2. **Грамматика**: Часть речи, род, множественное число (для существительных), формы времени (для глаголов) и т.д.
3. **Нюансы употребления**: Тонкости перевода, формальность, синонимы.
4. **Примеры**: 3 примера использования в контексте (предложение на "%[2]s" -> перевод на "%[1]s").

Отвечай только на языке "%[1]s" (кроме самих примеров). Используй Markdown.`

var ErrLimitExceeded = errors.New("gemini limit exceeded")

func (s *service) WordInfo(ctx context.Context, req WordInfoRequest) (string, error) {

	promt := BuildGeminiPrompt(req)

	result, err := s.client.Models.GenerateContent(
		ctx,
		s.Model,
		genai.Text(promt),
		nil,
	)

	if err != nil {
		slogger.Log.ErrorContext(ctx, "Genai client response error", "error", err)
		if strings.Contains(err.Error(), "429") || strings.Contains(strings.ToLower(err.Error()), "quota") {
			return "", ErrLimitExceeded
		}
		return "", fmt.Errorf("failed to generate content: %w", err)
	}

	if result == nil || result.Text() == "" {
		return "", fmt.Errorf("no result")
	}

	slogger.Log.DebugContext(ctx, "Genai promt and  result", "promt", promt, "result", result)

	return result.Text(), nil
}
func BuildGeminiPrompt(req WordInfoRequest) string {
	// Я использую явную индексацию аргументов %[1]s, %[2]s и т.д.
	// Это крутая фича Go! Она позволяет передать аргумент один раз,
	// но использовать его в шаблоне несколько раз, не дублируя в коде.
	return fmt.Sprintf(
		WordInfoPromptTemplate,
		req.SourceLang, // %[1]s
		req.TargetLang, // %[2]s
		req.SourceWord, // %[3]s
		req.TargetWord, // %[4]s
	)
}

const StartPracticeWithGeminiPromptTemplate = `You are an experienced foreign language teacher. Your task is to create a translation exercise for your student.

Student's native language (language of the tasks): %[1]s.
Target language: %[2]s.
Topic for the sentences: "%[3]s".

As a user message, you will receive a list of words that the student already knows.

Follow these steps strictly in order:
1. Analyze the provided list of words. Estimate the approximate language proficiency level (from A1 to C2) based on the complexity of these words.
2. Generate exactly 5 sentences in the "%[1]s" language on the given topic "%[3]s".
3. Main rule: Try to construct the sentences PRIMARILY using the words from the provided list. 
4. If the list does not contain enough words (or lacks specific parts of speech, like verbs or nouns) to create 5 meaningful and natural sentences on the topic, you are allowed to introduce new words. However, any new words you add MUST match the proficiency level you determined in Step 1.
5. You are allowed to add a minimal number of new words (prepositions, conjunctions, pronouns, basic linking verbs) only if strictly necessary for the grammatical correctness of the sentences.
6. The complexity of the grammatical structures in the sentences must correspond to the level you determined in Step 1.

Reply in Markdown format using the following template:

Determined level: [Write the level, e.g., A2]

1. Analyze the word list provided (pairs of words or phrases).
2. Create 5 diverse sentences for translation from "%[1]s" to "%[2]s".
3. The sentences should be based on the provided vocabulary and the specified topic: "%[3]s".
4. If no topic is provided, create general sentences using the vocabulary.
5. Determine the appropriate difficulty level based on the complexity of the vocabulary.

FORMATTING RULE: You MUST respond STRICTLY in valid JSON format. Do not include markdown code blocks (like ` + "```json" + `).

Use exactly this JSON schema:
{
  "level": "<Determined level, e.g., A2>",
  "sentences": [
    "<Sentence 1 in %[1]s>",
    "<Sentence 2 in %[1]s>",
    "<Sentence 3 in %[1]s>",
    "<Sentence 4 in %[1]s>",
    "<Sentence 5 in %[1]s>"
  ]
}
`

func (s *service) StartPracticeWithGemini(ctx context.Context, req *PracticeWithGemini, wordList string) (*StartPracticeWithGeminiResponse, error) {
	SystemPrompt := fmt.Sprintf(
		StartPracticeWithGeminiPromptTemplate,
		req.SourceLang,
		req.TargetLang,
		req.Topic,
	)
	config := &genai.GenerateContentConfig{
		SystemInstruction: &genai.Content{
			Parts: []*genai.Part{
				{Text: SystemPrompt},
			},
		},
		Temperature:      genai.Ptr[float32](0.3),
		ResponseMIMEType: "application/json",
	}

	result, err := s.client.Models.GenerateContent(
		ctx,
		s.Model,
		genai.Text(wordList),
		config,
	)

	if err != nil {
		slogger.Log.ErrorContext(ctx, "Genai client response error", "error", err)
		if strings.Contains(err.Error(), "429") || strings.Contains(strings.ToLower(err.Error()), "quota") {
			return nil, ErrLimitExceeded
		}
		return nil, fmt.Errorf("failed to generate content: %w", err)
	}

	if result == nil || result.Text() == "" {
		return nil, fmt.Errorf("no result")
	}

	slogger.Log.DebugContext(ctx, "Genai prompt and result", "result", result.Text())

	cleanJSON := extractJSON(result.Text())
	if cleanJSON == "" {
		slogger.Log.ErrorContext(ctx, "failed to extract JSON from gemini response", "text", result.Text())
		return nil, fmt.Errorf("failed to extract JSON from gemini response")
	}

	var resp StartPracticeWithGeminiResponse
	if err := json.Unmarshal([]byte(cleanJSON), &resp); err != nil {
		slogger.Log.ErrorContext(ctx, "failed to unmarshal gemini response", "error", err, "text", result.Text())
		return nil, fmt.Errorf("failed to unmarshal gemini response: %w", err)
	}

	return &resp, nil
}

const CheckAnswerPracticeWithGeminiPromptTemplate = `You are an experienced, patient, and supportive foreign language teacher. Your student has just completed a translation exercise.

Student's native language (language of explanations AND all UI labels): %[1]s.
Target language (language of the translations): %[2]s.
Exercise topic: "%[3]s".

As a user message, you will receive the original 5 sentences and the student's translation attempts. 

Your task is to review their work and provide constructive, detailed feedback. Follow these steps:
1. Match the student's translations to the original sentences.
2. Carefully analyze each translated sentence for grammatical correctness.
3. If a sentence is translated perfectly, praise the student.
4. If there are mistakes, gently explain *why* it's wrong and how to fix it.
5. IF THE STUDENT SKIPPED A SENTENCE, set the internal status to "skipped" and just provide the ideal translation.
6. CRITICAL RULE: Use the "%[1]s" language for all explanations, comments, and localized text.

FORMATTING RULE: You MUST respond STRICTLY in valid JSON format. Do not include markdown code blocks (like ` + "```json" + `).

Use exactly this JSON schema:
{
  "general_comment": "<Your overall encouraging feedback in %[1]s>",
  "results": [
    {
      "sentence_number": 1,
      "your_version": "<The student's text, or '-' if skipped>",
      "status": "<MUST BE ONE OF: 'correct', 'mistake', 'skipped'>",
      "status_localized": "<Translate the status to %[1]s. E.g., 'Правильно', 'Есть ошибки', 'Пропущено'>",
      "teacher_comment": "<Your explanation in %[1]s>",
      "ideal_translation": "<The correct translation in %[2]s>"
    }
  ]
}`

func (s *service) CheckAnswerPracticeWithGemini(ctx context.Context, req *PracticeWithGemini, translate string) (*CheckAnswerPracticeWithGeminiResponse, error) {
	SystemPrompt := fmt.Sprintf(
		CheckAnswerPracticeWithGeminiPromptTemplate,
		req.SourceLang,
		req.TargetLang,
		req.Topic,
	)
	config := &genai.GenerateContentConfig{
		SystemInstruction: &genai.Content{
			Parts: []*genai.Part{
				{Text: SystemPrompt},
			},
		},
		Temperature:      genai.Ptr[float32](0.1),
		ResponseMIMEType: "application/json",
	}

	result, err := s.client.Models.GenerateContent(
		ctx,
		s.Model,
		genai.Text(translate),
		config,
	)

	if err != nil {
		slogger.Log.ErrorContext(ctx, "Genai client response error", "error", err)
		if strings.Contains(err.Error(), "429") || strings.Contains(strings.ToLower(err.Error()), "quota") {
			return nil, ErrLimitExceeded
		}
		return nil, fmt.Errorf("failed to generate content: %w", err)
	}

	if result == nil || result.Text() == "" {
		return nil, fmt.Errorf("no result")
	}

	slogger.Log.DebugContext(ctx, "Genai prompt and result", "result", result.Text())

	cleanJSON := extractJSON(result.Text())
	if cleanJSON == "" {
		slogger.Log.ErrorContext(ctx, "failed to extract JSON from gemini response", "text", result.Text())
		return nil, fmt.Errorf("failed to extract JSON from gemini response")
	}

	var resp CheckAnswerPracticeWithGeminiResponse
	if err := json.Unmarshal([]byte(cleanJSON), &resp); err != nil {
		slogger.Log.ErrorContext(ctx, "failed to unmarshal gemini response", "error", err, "text", result.Text())
		return nil, fmt.Errorf("failed to unmarshal gemini response: %w", err)
	}

	return &resp, nil
}

const WordListRespPromptTemplate = `You are an expert foreign language teacher and curriculum designer. 
Your task is to generate a highly relevant and educational vocabulary list for a student.

Student's native language (Source Language): %[1]s
Language to learn (Target Language): %[2]s
Target Proficiency Level: %[3]s
Predefined Topic: %[4]q
User's Custom Request: %[5]q

Follow these instructions STRICTLY:
1. Create a comprehensive list of ALL necessary vocabulary words for a complete study of the topic at the given language level. The list should be around 100 words. List ONLY words.
2. The complexity of the words MUST strictly match the requested Proficiency Level (%[3]s). For example, if the level is A1, use basic, everyday words. If C1, use advanced and nuanced vocabulary.
3. Topic Selection Logic:
   - If a "Predefined Topic" is provided (e.g., "Technology & Media"), select words that are highly relevant to this topic AND match the proficiency level.
   - If a "User's Custom Request" is provided, incorporate this specific context into your word selection.
   - If the "Predefined Topic" is empty or missing, rely ENTIRELY on the "User's Custom Request".
4. For the "Comment" field, you MUST write the pronunciation of the "TargetWord". Rule for pronunciation: Write how the word sounds using ONLY the letters of the student's native language (%[1]s) alphabet. It is STRICTLY FORBIDDEN to use International Phonetic Alphabet (IPA) symbols. Write in lowercase letters, but you MUST capitalize the stressed vowel.

FORMATTING RULE: You MUST respond STRICTLY in valid JSON format. Do not include markdown code blocks (like ` + "```json" + `). Do not include any other text.

Use exactly this JSON schema (array of objects):
[
  {
    "SourceWord": "<Word or phrase in %[1]s>",
    "TargetWord": "<Translation in %[2]s>",
    "Comment": "<Pronunciation generated according to Rule 4>"
  }
]
`

func (s *service) WordList(ctx context.Context, req WordListReq) ([]WordListResp, error) {
	if req.Topic == "" && req.UserTopic == "" {
		return nil, fmt.Errorf("either topic or user_topic must be provided")
	}

	SystemPrompt := fmt.Sprintf(
		WordListRespPromptTemplate,
		req.SourceLang,
		req.TargetLang,
		req.Level,
		req.Topic,
		req.UserTopic,
	)
	config := &genai.GenerateContentConfig{
		SystemInstruction: &genai.Content{
			Parts: []*genai.Part{
				{Text: SystemPrompt},
			},
		},
		Temperature:      genai.Ptr[float32](0.1),
		ResponseMIMEType: "application/json",
	}

	result, err := s.client.Models.GenerateContent(
		ctx,
		s.Model,
		genai.Text("Generate the word list according to the system instructions."),
		config,
	)

	if err != nil {
		slogger.Log.ErrorContext(ctx, "Genai client response error", "error", err)
		if strings.Contains(err.Error(), "429") || strings.Contains(strings.ToLower(err.Error()), "quota") {
			return nil, ErrLimitExceeded
		}
		return nil, fmt.Errorf("failed to generate content: %w", err)
	}

	if result == nil || result.Text() == "" {
		slogger.Log.ErrorContext(ctx, "Gemini returned empty result for WordList", "request", req)
		return nil, fmt.Errorf("no result from Gemini")
	}

	slogger.Log.DebugContext(ctx, "Gemini WordList raw response", "text", result.Text())

	cleanJSON := extractJSON(result.Text())
	if cleanJSON == "" {
		slogger.Log.ErrorContext(ctx, "failed to extract JSON from gemini response", "text", result.Text(), "request", req)
		return nil, fmt.Errorf("failed to extract JSON from gemini response")
	}

	var resp []WordListResp
	if err := json.Unmarshal([]byte(cleanJSON), &resp); err != nil {
		slogger.Log.ErrorContext(ctx, "failed to unmarshal gemini response", "error", err, "text", result.Text(), "request", req)
		return nil, fmt.Errorf("failed to unmarshal gemini response: %w", err)
	}

	return resp, nil
}

func extractJSON(s string) string {
	firstOpenBrace := strings.Index(s, "{")
	firstOpenBracket := strings.Index(s, "[")

	start := -1
	if firstOpenBrace != -1 && (firstOpenBracket == -1 || firstOpenBrace < firstOpenBracket) {
		start = firstOpenBrace
	} else {
		start = firstOpenBracket
	}

	if start == -1 {
		return ""
	}

	lastCloseBrace := strings.LastIndex(s, "}")
	lastCloseBracket := strings.LastIndex(s, "]")

	end := -1
	if lastCloseBrace != -1 && (lastCloseBracket == -1 || lastCloseBrace > lastCloseBracket) {
		end = lastCloseBrace
	} else {
		end = lastCloseBracket
	}

	if end == -1 || end < start {
		return ""
	}

	return s[start : end+1]
}
