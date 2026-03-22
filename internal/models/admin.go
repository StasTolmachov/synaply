package models

type AdminStats struct {
	TotalUsers       int64 `json:"total_users"`
	TotalWords       int64 `json:"total_words"`
	TotalLessons     int64 `json:"total_lessons"`
	TotalPublicLists int64 `json:"total_public_lists"`
	TotalPlaylists   int64 `json:"total_playlists"`
	NewUsersLast24h  int64 `json:"new_users_24h"`
}
