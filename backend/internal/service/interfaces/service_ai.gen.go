package interfaces

import "context"

type AIAPIService interface {
	CreateAiConversation (ctx context.Context, req interface{}) (interface{}, error)
	CreateAiRun (ctx context.Context, req interface{}) (interface{}, error)
	DeleteAiConversation (ctx context.Context, req interface{}) (interface{}, error)
	GetAiConversation (ctx context.Context, req interface{}) (interface{}, error)
	InlineEditAi (ctx context.Context, req interface{}) (interface{}, error)
	InlineEditAiRun (ctx context.Context, req interface{}) (interface{}, error)
	ListAiConversations (ctx context.Context, req interface{}) (interface{}, error)
	ProvideAiRunConsent (ctx context.Context, req interface{}) (interface{}, error)
	UpdateAiConversation (ctx context.Context, req interface{}) (interface{}, error)
}
