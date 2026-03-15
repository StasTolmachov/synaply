package gemini

type Request struct {
	SourceLang string `json:"source_lang"`
	TargetLang string `json:"target_lang"`
	SourceWord string `json:"source_word"`
	TargetWord string `json:"target_word"`
}

type Response struct {
	Response string `json:"response"`
}
