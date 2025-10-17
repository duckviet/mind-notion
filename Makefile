generate:
	swagger-cli bundle openapi/openapi.yaml -o openapi/dist.yaml --type yaml
	oapi-codegen -generate types,server,spec -package api -o internal/api.gen.go openapi/dist.yaml