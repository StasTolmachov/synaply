package deepl

// DeepLRequest описывает JSON, который мы отправляем в DeepL
type DeepLRequest struct {
	Text       []string `json:"text"`
	TargetLang string   `json:"target_lang"`
}

// DeepLResponse описывает JSON, который DeepL возвращает нам
type DeepLResponse struct {
	Translations []struct {
		DetectedSourceLanguage string `json:"detected_source_language"`
		Text                   string `json:"text"`
	} `json:"translations"`
}
