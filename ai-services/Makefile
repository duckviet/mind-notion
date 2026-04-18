.PHONY: install lint typecheck test run clean

install:
	uv sync

lint:
	ruff check src/

typecheck:
	pyright src/

test:
	pytest tests/ -v

run:
	uv run python -m ai_services.main

dev:
	AI_SERVICE_RELOAD=true uv run python -m ai_services.main

clean:
	rm -rf .pytest_cache/ .ruff_cache/ __pycache__/ src/**/__pycache__/
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete