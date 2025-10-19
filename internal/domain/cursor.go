package domain

// Cursor represents a cursor in the system
type Cursor struct {
	Index  int `json:"index"`
	Length int `json:"length"`
}
