package gemini

import (
	"context"
	"fmt"

	"google.golang.org/genai"

	"wordsGo_v2/slogger"
)

type Service interface {
	WordInfo(ctx context.Context, req WordInfoRequest) (string, error)
	StartPracticeWithGemini(ctx context.Context, req *PracticeWithGemini, wordList string) (string, error)
	CheckAnswerPracticeWithGemini(ctx context.Context, req *PracticeWithGemini, translate string) (string, error)
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
3. Main rule: the sentences must be constructed PRIMARILY from the words provided in the list.
4. You are allowed to add a minimal number of new words (prepositions, conjunctions, pronouns, basic linking verbs) only if strictly necessary for the grammatical correctness of the sentences.
5. The complexity of the grammatical structures in the sentences must correspond to the level you determined in Step 1.

Reply in Markdown format using the following template:

**Determined level:** [Write the level, e.g., A2]

1. [Sentence 1 in the "%[1]s" language]


2. [Sentence 2 in the "%[1]s" language]


And so on for all 5 sentences. Do not write anything extra.`

func (s *service) StartPracticeWithGemini(ctx context.Context, req *PracticeWithGemini, wordList string) (string, error) {
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
		Temperature: genai.Ptr[float32](0.3),
	}

	result, err := s.client.Models.GenerateContent(
		ctx,
		s.Model,
		genai.Text(wordList),
		config,
	)

	if err != nil {
		slogger.Log.ErrorContext(ctx, "Genai client response error", "error", err)
		return "", fmt.Errorf("failed to generate content: %w", err)
	}

	if result == nil || result.Text() == "" {
		return "", fmt.Errorf("no result")
	}

	slogger.Log.DebugContext(ctx, "Genai promt and  result", "result", result)

	return result.Text(), nil
}

const CheckAnswerPracticeWithGeminiPromptTemplate = `You are an experienced, patient, and supportive foreign language teacher. Your student has just completed a translation exercise.

Student's native language (language of explanations AND all UI labels): %[1]s.
Target language (language of the translations): %[2]s.
Exercise topic: "%[3]s".

As a user message, you will receive the student's translation attempts for 5 sentences.

Your task is to review their work and provide constructive, detailed feedback. Follow these steps:
1. Carefully analyze each translated sentence for grammatical correctness, vocabulary usage, and natural phrasing in the "%[2]s" language.
2. Identify any mistakes (syntax, spelling, wrong word choice, etc.).
3. If a sentence is translated perfectly, praise the student!
4. If there are mistakes, gently explain *why* it's wrong and how to fix it.
5. CRITICAL RULE: Use the "%[1]s" language for EVERYTHING except the translations themselves. This includes all explanations, comments, praise, and translating the structural labels (e.g., "General comment", "Sentence", "Your version", "Status", "Teacher's comment", "Ideal translation").
6. Provide the ideal/corrected version for each sentence in the "%[2]s" language.

Reply strictly in Markdown format using the following structure. YOU MUST TRANSLATE the bracketed labels into the "%[1]s" language:

**[General comment]:** [A short encouraging message about their overall performance in "%[1]s"]

**[Sentence 1]:**
* **[Your version]:** [The student's text]
* **[Status]:** [✅ Correct / ❌ Has mistakes] (Translate 'Correct' and 'Has mistakes' to "%[1]s")
* **[Teacher's comment]:** [Your detailed explanation in "%[1]s", or praise if correct]
* **[Ideal translation]:** [The correct translation in "%[2]s"]

**[Sentence 2]:**
...[Repeat the structure for all 5 sentences]...
`

func (s *service) CheckAnswerPracticeWithGemini(ctx context.Context, req *PracticeWithGemini, translate string) (string, error) {
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
		Temperature: genai.Ptr[float32](0.3),
	}

	result, err := s.client.Models.GenerateContent(
		ctx,
		s.Model,
		genai.Text(translate),
		config,
	)

	if err != nil {
		slogger.Log.ErrorContext(ctx, "Genai client response error", "error", err)
		return "", fmt.Errorf("failed to generate content: %w", err)
	}

	if result == nil || result.Text() == "" {
		return "", fmt.Errorf("no result")
	}

	slogger.Log.DebugContext(ctx, "Genai promt and  result", "result", result)

	return result.Text(), nil
}
