# ai-services

Unified Python AI services for Mind Notion.

## Structure

- `main.py`: single entrypoint exposing all AI endpoints.
- `agent/`: agent runtime library (tool-calling, streaming, approvals).
- `rag/`: chunking/embedding library for note indexing.

## Run locally

```bash
cd ai-services
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

## Docker

```bash
cd ai-services
docker build -t mind-notion-ai-services .
docker run --rm -p 8090:8090 --env-file .env mind-notion-ai-services
```

## Environment variables

- `AI_SERVICE_HOST` (default: `0.0.0.0`)
- `AI_SERVICE_PORT` (default: `8090`)
- `AI_SERVICE_RELOAD` (default: `true` for local run)
- `OPENAI_API_KEY`
- `AI_INTERNAL_TOKEN`
- `BACKEND_INTERNAL_BASE_URL` (default: `http://localhost:8080`)
- `BACKEND_INTERNAL_TOKEN`
- `BACKEND_TOOL_TIMEOUT_MS` (default: `30000`)
- `AI_SERVICE_TOKEN` (optional fallback for backend tool token)
- `CHUNK_SIZE` (default: `1000`)
- `CHUNK_OVERLAP` (default: `200`)
- `CHUNKS_OUTPUT_DIR` (default: `./rag/data/chunks`)
- `EMBED_URL` (default: `https://vuttc-bge-m3-onnx.hf.space/embed`)

`main.py` auto-loads variables from `ai-services/.env` if present.
