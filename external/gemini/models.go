package gemini

import (
	"wordsGo_v2/internal/repository/modelsDB"
)

type WordInfoRequest struct {
	SourceLang string `json:"source_lang"`
	TargetLang string `json:"target_lang"`
	SourceWord string `json:"source_word"`
	TargetWord string `json:"target_word"`
}

type WordInfoResponse struct {
	Response string `json:"response"`
}

func ReqToGeminiReq(req WordInfoRequest) *modelsDB.GeminiReq {
	return &modelsDB.GeminiReq{
		SourceLang: req.SourceLang,
		TargetLang: req.TargetLang,
		SourceWord: req.SourceWord,
		TargetWord: req.TargetWord,
	}
}

func GeminiRespToResp(resp *modelsDB.GeminiResp) *WordInfoResponse {
	return &WordInfoResponse{
		Response: resp.Response,
	}
}

type PracticeWithGemini struct {
	SourceLang string `json:"source_lang"`
	TargetLang string `json:"target_lang"`
	Topic      string `json:"topic"`
}

type WordList struct {
	SourceWord string
	TargetWord string
}
