package interfaces

import "context"

type AIAPIService interface {
	CreateAiRun (ctx context.Context, req interface{}) (interface{}, error)
	InlineEditAi (ctx context.Context, req interface{}) (interface{}, error)
	ProvideAiRunConsent (ctx context.Context, req interface{}) (interface{}, error)
}
