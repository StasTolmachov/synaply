package deepl

// Request describes the JSON we send to DeepL
type Request struct {
	Text       []string `json:"text"`
	SourceLang string   `json:"source_lang"`
	TargetLang string   `json:"target_lang,omitempty"`
}

// Response describes the JSON DeepL returns to us
type Response struct {
	Translations []struct {
		DetectedSourceLanguage string `json:"detected_source_language"`
		Text                   string `json:"text"`
	} `json:"translations"`
}
