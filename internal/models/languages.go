package models

import "sort"

type LangCodeResp struct {
	Source string `json:"source"`
	Target string `json:"target"`
}
type LangItem struct {
	Code string `json:"code"`
	Name string `json:"name"`
}
type LangResponse struct {
	Source []LangItem `json:"source"`
	Target []LangItem `json:"target"`
}

var (
	SortedSourceLanguages []LangItem
	SortedTargetLanguages []LangItem
)

func init() {
	SortedSourceLanguages = sortLanguagesMap(SourceLanguages)
	SortedTargetLanguages = sortLanguagesMap(TargetLanguages)
}

func sortLanguagesMap(langMap map[string]string) []LangItem {
	result := make([]LangItem, 0, len(langMap))

	// Перекладываем данные из мапы в слайс
	for code, name := range langMap {
		result = append(result, LangItem{Code: code, Name: name})
	}

	// Сортируем слайс по полю Name (по алфавиту)
	sort.Slice(result, func(i, j int) bool {
		return result[i].Name < result[j].Name
	})

	return result
}

// SourceLanguages содержит языки, С которых можно переводить (Оригинал).
var SourceLanguages = map[string]string{
	"ACE": "Acehnese",
	"AF":  "Afrikaans",
	"AN":  "Aragonese",
	"AR":  "Arabic",
	"AS":  "Assamese",
	"AY":  "Aymara",
	"AZ":  "Azerbaijani",
	"BA":  "Bashkir",
	"BE":  "Belarusian",
	"BG":  "Bulgarian",
	"BHO": "Bhojpuri",
	"BN":  "Bengali",
	"BR":  "Breton",
	"BS":  "Bosnian",
	"CA":  "Catalan",
	"CEB": "Cebuano",
	"CKB": "Kurdish (Sorani)",
	"CS":  "Czech",
	"CY":  "Welsh",
	"DA":  "Danish",
	"DE":  "German",
	"EL":  "Greek",
	"EN":  "English",
	"EO":  "Esperanto",
	"ES":  "Spanish",
	"ET":  "Estonian",
	"EU":  "Basque",
	"FA":  "Persian",
	"FI":  "Finnish",
	"FR":  "French",
	"GA":  "Irish",
	"GL":  "Galician",
	"GN":  "Guarani",
	"GOM": "Konkani",
	"GU":  "Gujarati",
	"HA":  "Hausa",
	"HE":  "Hebrew",
	"HI":  "Hindi",
	"HR":  "Croatian",
	"HT":  "Haitian Creole",
	"HU":  "Hungarian",
	"HY":  "Armenian",
	"ID":  "Indonesian",
	"IG":  "Igbo",
	"IS":  "Icelandic",
	"IT":  "Italian",
	"JA":  "Japanese",
	"JV":  "Javanese",
	"KA":  "Georgian",
	"KK":  "Kazakh",
	"KMR": "Kurdish (Kurmanji)",
	"KO":  "Korean",
	"KY":  "Kyrgyz",
	"LA":  "Latin",
	"LB":  "Luxembourgish",
	"LMO": "Lombard",
	"LN":  "Lingala",
	"LT":  "Lithuanian",
	"LV":  "Latvian",
	"MAI": "Maithili",
	"MG":  "Malagasy",
	"MI":  "Maori",
	"MK":  "Macedian",
	"ML":  "Malayalam",
	"MN":  "Mongolian",
	"MR":  "Marathi",
	"MS":  "Malay",
	"MT":  "Maltese",
	"MY":  "Burmese",
	"NB":  "Norwegian Bokmål",
	"NE":  "Nepali",
	"NL":  "Dutch",
	"OC":  "Occitan",
	"OM":  "Oromo",
	"PA":  "Punjabi",
	"PAG": "Pangasinan",
	"PAM": "Kapampangan",
	"PL":  "Polish",
	"PRS": "Dari",
	"PS":  "Pashto",
	"PT":  "Portuguese",
	"QU":  "Quechua",
	"RO":  "Romanian",
	"RU":  "Russian",
	"SA":  "Sanskrit",
	"SCN": "Sicilian",
	"SK":  "Slovak",
	"SL":  "Slovenian",
	"SQ":  "Albanian",
	"SR":  "Serbian",
	"ST":  "Sesotho",
	"SU":  "Sundanese",
	"SV":  "Swedish",
	"SW":  "Swahili",
	"TA":  "Tamil",
	"TE":  "Telugu",
	"TG":  "Tajik",
	"TH":  "Thai",
	"TK":  "Turkmen",
	"TL":  "Tagalog",
	"TN":  "Tswana",
	"TR":  "Turkish",
	"TS":  "Tsonga",
	"TT":  "Tatar",
	"UK":  "Ukrainian",
	"UR":  "Urdu",
	"UZ":  "Uzbek",
	"VI":  "Vietnamese",
	"WO":  "Wolof",
	"XH":  "Xhosa",
	"YI":  "Yiddish",
	"YUE": "Cantonese",
	"ZH":  "Chinese",
	"ZU":  "Zulu",
}

// TargetLanguages содержит языки, НА которые можно переводить (Перевод).
// Отличается наличием региональных диалектов (EN-US, PT-BR и т.д.)
var TargetLanguages = map[string]string{
	"ACE":     "Acehnese",
	"AF":      "Afrikaans",
	"AN":      "Aragonese",
	"AR":      "Arabic",
	"AS":      "Assamese",
	"AY":      "Aymara",
	"AZ":      "Azerbaijani",
	"BA":      "Bashkir",
	"BE":      "Belarusian",
	"BG":      "Bulgarian",
	"BHO":     "Bhojpuri",
	"BN":      "Bengali",
	"BR":      "Breton",
	"BS":      "Bosnian",
	"CA":      "Catalan",
	"CEB":     "Cebuano",
	"CKB":     "Kurdish (Sorani)",
	"CS":      "Czech",
	"CY":      "Welsh",
	"DA":      "Danish",
	"DE":      "German",
	"EL":      "Greek",
	"EN":      "English",
	"EN-GB":   "English (British)",
	"EN-US":   "English (American)",
	"EO":      "Esperanto",
	"ES":      "Spanish",
	"ES-419":  "Spanish (Latin American)",
	"ET":      "Estonian",
	"EU":      "Basque",
	"FA":      "Persian",
	"FI":      "Finnish",
	"FR":      "French",
	"GA":      "Irish",
	"GL":      "Galician",
	"GN":      "Guarani",
	"GOM":     "Konkani",
	"GU":      "Gujarati",
	"HA":      "Hausa",
	"HE":      "Hebrew",
	"HI":      "Hindi",
	"HR":      "Croatian",
	"HT":      "Haitian Creole",
	"HU":      "Hungarian",
	"HY":      "Armenian",
	"Slug":    "Indonesian",
	"IG":      "Igbo",
	"IS":      "Icelandic",
	"IT":      "Italian",
	"JA":      "Japanese",
	"JV":      "Javanese",
	"KA":      "Georgian",
	"KK":      "Kazakh",
	"KMR":     "Kurdish (Kurmanji)",
	"KO":      "Korean",
	"KY":      "Kyrgyz",
	"LA":      "Latin",
	"LB":      "Luxembourgish",
	"LMO":     "Lombard",
	"LN":      "Lingala",
	"LT":      "Lithuanian",
	"LV":      "Latvian",
	"MAI":     "Maithili",
	"MG":      "Malagasy",
	"MI":      "Maori",
	"MK":      "Macedonian",
	"ML":      "Malayalam",
	"MN":      "Mongolian",
	"MR":      "Marathi",
	"MS":      "Malay",
	"MT":      "Maltese",
	"MY":      "Burmese",
	"NB":      "Norwegian Bokmål",
	"NE":      "Nepali",
	"NL":      "Dutch",
	"OC":      "Occitan",
	"OM":      "Oromo",
	"PA":      "Punjabi",
	"PAG":     "Pangasinan",
	"PAM":     "Kapampangan",
	"PL":      "Polish",
	"PRS":     "Dari",
	"PS":      "Pashto",
	"PT":      "Portuguese",
	"PT-BR":   "Portuguese (Brazilian)",
	"PT-PT":   "Portuguese (excluding Brazilian)",
	"QU":      "Quechua",
	"RO":      "Romanian",
	"RU":      "Russian",
	"SA":      "Sanskrit",
	"SCN":     "Sicilian",
	"SK":      "Slovak",
	"SL":      "Slovenian",
	"SQ":      "Albanian",
	"SR":      "Serbian",
	"ST":      "Sesotho",
	"SU":      "Sundanese",
	"SV":      "Swedish",
	"SW":      "Swahili",
	"TA":      "Tamil",
	"TE":      "Telugu",
	"TG":      "Tajik",
	"TH":      "Thai",
	"TK":      "Turkmen",
	"TL":      "Tagalog",
	"TN":      "Tswana",
	"TR":      "Turkish",
	"TS":      "Tsonga",
	"TT":      "Tatar",
	"UK":      "Ukrainian",
	"UR":      "Urdu",
	"UZ":      "Uzbek",
	"VI":      "Vietnamese",
	"WO":      "Wolof",
	"XH":      "Xhosa",
	"YI":      "Yiddish",
	"YUE":     "Cantonese",
	"ZH":      "Chinese",
	"ZH-HANS": "Chinese (simplified)",
	"ZH-HANT": "Chinese (traditional)",
	"ZU":      "Zulu",
}

// IsValidSourceLanguage проверяет, поддерживается ли язык для исходного текста
func IsValidSourceLanguage(code string) bool {
	_, exists := SourceLanguages[code]
	return exists
}

// IsValidTargetLanguage проверяет, поддерживается ли язык для перевода
func IsValidTargetLanguage(code string) bool {
	_, exists := TargetLanguages[code]
	return exists
}
