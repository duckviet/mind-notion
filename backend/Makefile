# generate-oapi-codegen:
# 	swagger-cli bundle openapi/openapi.yaml -o openapi/dist.yaml --type yaml
# 	oapi-codegen -generate types,server,spec -package api -o internal/api.gen.go openapi/dist.yaml
# Variables
OAPI_SPEC_SRC := openapi/openapi.yaml
OAPI_SPEC_DST := openapi/dist.yaml
GENERATED_SRC_DIR := internal/generated-gin-server
HANDLERS_DST_DIR := internal/handlers
HANDLERS_INTERFACE_DST_DIR := internal/handlers/interfaces
SERVICE_INTERFACE_DST_DIR := internal/service/interfaces
DTO_DST_DIR := internal/dto

# Thay thế bằng tên module thực tế trong go.mod của bạn
MODULE_NAME := github.com/duckviet/gin-collaborative-editor

.PHONY: openapi-generator-cli

openapi-generator-cli:
	@echo "0. --- Generating bundle file to dist ---"
	swagger-cli bundle ${OAPI_SPEC_SRC} -o ${OAPI_SPEC_DST} --type yaml

	@echo "1. --- Generating a new Gin server project ---"
	npx @openapitools/openapi-generator-cli generate \
		-i $(OAPI_SPEC_DST) \
		-g go-gin-server \
		-o $(GENERATED_SRC_DIR) \
		--additional-properties=packageName=oapi,gitUserId=duckviet,gitRepoId=gin-collaborative-editor,generateMain=false,generateDockerfile=false,generateGoMod=false

	@echo "2. --- Preparing destination directories ---"
	mkdir -p $(HANDLERS_INTERFACE_DST_DIR)
	mkdir -p $(SERVICE_INTERFACE_DST_DIR)
	mkdir -p $(DTO_DST_DIR)

	@echo "3. --- Extracting Interfaces ---"
	@for f in $(GENERATED_SRC_DIR)/go/api_*.go; do \
		api_name=$$(grep "type .* struct" $$f | awk '{print $$2}'); \
		if [ -z "$$api_name" ]; then continue; fi; \
		base_name=$$(basename "$$f" .go); \
		base_name=$${base_name#api_}; \
		\
		# --- TẠO HANDLER INTERFACE (Cho tầng Giao diện/API) --- \
		h_dest="$(HANDLERS_INTERFACE_DST_DIR)/api_$${base_name}.gen.go"; \
		echo "package interfaces\n\nimport \"github.com/gin-gonic/gin\"\n\ntype $${api_name}Handler interface {" > $$h_dest; \
		grep "func (api \*$$api_name)" $$f | sed 's/func (api \*'$$api_name') \(.*\) {/\t\1/' >> $$h_dest; \
		echo "}" >> $$h_dest; \
		\
		# --- TẠO SERVICE INTERFACE (Cho tầng Logic nghiệp vụ - Clean) --- \
		s_dest="$(SERVICE_INTERFACE_DST_DIR)/service_$${base_name}.gen.go"; \
		echo "package interfaces\n\nimport \"context\"\n\ntype $${api_name}Service interface {" > $$s_dest; \
		grep "func (api \*$$api_name)" $$f | \
			sed 's/func (api \*'$$api_name') //' | \
			sed 's/(c \*gin.Context)/ (ctx context.Context, req interface{}) (interface{}, error)/' | \
			sed 's/ {//' | sed 's/^/\t/' >> $$s_dest; \
		echo "}" >> $$s_dest; \
		echo "Generated: Handler & Service for $$api_name"; \
	done

	@echo "4. --- Moving Models and Routers ---"
	mv -f $(GENERATED_SRC_DIR)/go/model_*.go $(DTO_DST_DIR)/ || true
	mv -f $(GENERATED_SRC_DIR)/go/routers.go $(HANDLERS_DST_DIR)/routers.gen.go

	@echo "5. --- Fixing Package Declarations & Imports ---"
	# Sửa package cho DTO và Router
	sed -i 's/package oapi/package dto/g' $(DTO_DST_DIR)/*.go 2>/dev/null || true
	sed -i 's/package oapi/package handlers/g' $(HANDLERS_DST_DIR)/routers.gen.go
	
	# Sửa import trong routers.gen.go để trỏ đúng vào package dto mới
	sed -i 's|"$(MODULE_NAME)/go"|"$(MODULE_NAME)/internal/dto"|g' $(HANDLERS_DST_DIR)/routers.gen.go

	@echo "6. --- Cleaning up ---"
	rm -rf $(GENERATED_SRC_DIR)
	@echo "--- Code generation and integration complete! ---"

oapi-codegen:

	@echo "1. --- Generating Go code using oapi-codegen ---"
	mkdir -p $(MODEL_DST_DIR) $(API_DST_DIR)

	# Sinh types (models)
	oapi-codegen -generate "types" -package model \
		-o $(MODEL_DST_DIR)/types.gen.go $(OAPI_SPEC_DST)

	# Sinh server handlers (Gin)
	oapi-codegen -generate "gin" -package api \
		-o $(API_DST_DIR)/api.gen.go $(OAPI_SPEC_DST)

	@echo "--- Code generation via oapi-codegen complete! ---"

.PHONY: dev db-up db-down dev-up dev-down clean

# Development commands
dev:
	@echo "Starting development environment..."
	@echo "1. Start databases: make db-up"
	@echo "2. Run Go app with hot reload: make dev-up"
	@echo "3. Stop all: make dev-down"

# Start only databases
db-up:
	docker compose up -d postgres redis adminer
	@echo "Databases started!"
	@echo "PostgreSQL: localhost:5433"
	@echo "Redis: localhost:6380" 
	@echo "Adminer: http://localhost:8081"

# Stop databases
db-down:
	docker compose down

# Start full development environment (databases + Go app with hot reload)
dev-up:
	docker compose -f docker-compose.dev.yml up -d
	@echo "Full development environment started!"
	@echo "Go app: http://localhost:8080"
	@echo "Adminer: http://localhost:8081"

# Stop full development environment
dev-down:
	docker compose -f docker-compose.dev.yml down

# Clean up
clean:
	docker compose down -v
	docker compose -f docker-compose.dev.yml down -v
	docker system prune -f