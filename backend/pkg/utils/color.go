package utils

// ColorPalette contains a set of colors for user identification
var ColorPalette = []string{
	"#e11d48", // Red
	"#10b981", // Green
	"#3b82f6", // Blue
	"#f59e0b", // Yellow
	"#8b5cf6", // Purple
	"#14b8a6", // Teal
	"#ef4444", // Red-500
	"#06b6d4", // Cyan
	"#84cc16", // Lime
	"#f97316", // Orange
}

// GetColorForIndex returns a color for the given index
func GetColorForIndex(index int) string {
	return ColorPalette[index%len(ColorPalette)]
}
