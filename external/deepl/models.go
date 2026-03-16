package deepl

// Request описывает JSON, который мы отправляем в DeepL
type Request struct {
	Text       []string `json:"text"`
	SourceLang string   `json:"source_lang"`
	TargetLang string   `json:"target_lang,omitempty"`
}

// Response описывает JSON, который DeepL возвращает нам
type Response struct {
	Translations []struct {
		DetectedSourceLanguage string `json:"detected_source_language"`
		Text                   string `json:"text"`
	} `json:"translations"`
}
