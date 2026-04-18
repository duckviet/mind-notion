package interfaces

import "context"

type FolderAPIService interface {
	AddNoteToFolder (ctx context.Context, req interface{}) (interface{}, error)
	CreateFolder (ctx context.Context, req interface{}) (interface{}, error)
	DeleteFolder (ctx context.Context, req interface{}) (interface{}, error)
	GetFolder (ctx context.Context, req interface{}) (interface{}, error)
	ListFolders (ctx context.Context, req interface{}) (interface{}, error)
	ReorderFolders (ctx context.Context, req interface{}) (interface{}, error)
	UpdateFolder (ctx context.Context, req interface{}) (interface{}, error)
}
