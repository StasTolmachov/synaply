package gemini

import "wordsGo_v2/internal/repository/modelsDB"

type Request struct {
	SourceLang string `json:"source_lang"`
	TargetLang string `json:"target_lang"`
	SourceWord string `json:"source_word"`
	TargetWord string `json:"target_word"`
}

type Response struct {
	Response string `json:"response"`
}

func ReqToGeminiReq(req Request) *modelsDB.GeminiReq {
	return &modelsDB.GeminiReq{
		SourceLang: req.SourceLang,
		TargetLang: req.TargetLang,
		SourceWord: req.SourceWord,
		TargetWord: req.TargetWord,
	}
}

func GeminiRespToResp(resp *modelsDB.GeminiResp) *Response {
	return &Response{
		Response: resp.Response,
	}
}
