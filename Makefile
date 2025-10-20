generate-oapi-codegen:
	swagger-cli bundle openapi/openapi.yaml -o openapi/dist.yaml --type yaml
	oapi-codegen -generate types,server,spec -package api -o internal/api.gen.go openapi/dist.yaml

OAPI_SPEC_SRC := openapi/openapi.yaml
OAPI_SPEC_DST := openapi/dist.yaml
GENERATED_SRC_DIR := internal/generated-gin-server
HANDLERS_DST_DIR := internal/handlers
DTO_DST_DIR := internal/dto

.PHONY: generate-gin-server
# Target để tạo một dự án Gin mới
generate-gin-server:
	@echo "0. --- Generating bunble file to dist ---"
	swagger-cli bundle ${OAPI_SPEC_SRC} -o ${OAPI_SPEC_DST} --type yaml
	@echo "1.--- Generating a new Gin server project ---"
	npx @openapitools/openapi-generator-cli generate \
		-i $(OAPI_SPEC_DST) \
		-g go-gin-server \
		-o $(GENERATED_SRC_DIR) \
		--additional-properties=packageName=oapi,gitUserId=duckviet,gitRepoId=gin-collaborative-editor,generateMain=false,generateDockerfile=false,generateGoMod=false
	
	@echo "2. --- Preparing destination directories: $(HANDLERS_DST_DIR) and $(DTO_DST_DIR) ---"
	mkdir -p $(HANDLERS_DST_DIR)
	mkdir -p $(DTO_DST_DIR)

	@echo "3. --- Moving generated files to their final destinations ---"
	mv -f $(GENERATED_SRC_DIR)/go/routers.go $(HANDLERS_DST_DIR)/routers.gen.go
	mv -f $(GENERATED_SRC_DIR)/go/model_*.go $(DTO_DST_DIR)/
	mv -f $(GENERATED_SRC_DIR)/go/api_*.go $(HANDLERS_DST_DIR)/

	@echo "4. --- Fixing package declarations in moved files ---"
	# Sửa package trong file router thành 'package handlers'
	sed -i 's/package oapi/package handlers/g' $(HANDLERS_DST_DIR)/routers.gen.go

    # Sửa package trong file api_*.go thành 'package handlers'
	@for f in $(HANDLERS_DST_DIR)/api_*.go; do \
		sed -i 's/package oapi/package handlers/g' "$$f"; \
	done

	# Sửa package trong tất cả file model thành 'package dto'
	@for f in $(DTO_DST_DIR)/model_*.go; do \
		sed -i 's/package oapi/package dto/g' "$$f"; \
	done

	@echo "5. --- Cleaning up temporary generation directory ---"
	rm -rf $(GENERATED_SRC_DIR)

	@echo "--- Code generation and integration complete! ---"

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