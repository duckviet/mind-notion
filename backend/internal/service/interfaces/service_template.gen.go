package interfaces

import "context"

type TemplateAPIService interface {
	CreateTemplate (ctx context.Context, req interface{}) (interface{}, error)
	DeleteTemplate (ctx context.Context, req interface{}) (interface{}, error)
	GetTemplate (ctx context.Context, req interface{}) (interface{}, error)
	ListTemplates (ctx context.Context, req interface{}) (interface{}, error)
	UpdateTemplate (ctx context.Context, req interface{}) (interface{}, error)
}
