package deepl

// Request описывает JSON, который мы отправляем в DeepL
type Request struct {
	Text       []string `json:"text"`
	TargetLang string   `json:"target_lang"`
}

// Response описывает JSON, который DeepL возвращает нам
type Response struct {
	Translations []struct {
		DetectedSourceLanguage string `json:"detected_source_language"`
		Text                   string `json:"text"`
	} `json:"translations"`
}
