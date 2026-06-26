# AI Agent Production Review

## 1. Flow hien tai tu FE den BE den AI service

AI agent hien tai duoc thiet ke theo mo hinh editor-first: frontend goi AI tu rich text editor, Go backend lam lop auth/proxy, Python `ai-services` chay agent, tool va RAG.

### Flow inline edit

1. User thao tac trong editor.
2. `apps/web/shared/components/RichTextEditor/RichTextEditor.tsx` nhan `onAIAction`.
3. Frontend goi `requestInlineEdit` trong `apps/web/shared/services/ai/inline-edit.ts`.
4. Frontend uu tien streaming qua `/api/v1/ai/inline-edit/runs`.
5. Go handler `backend/internal/handlers/ai_run_handler.go` validate user, validate note ownership neu co `note_id`, build payload va proxy sang Python.
6. Python FastAPI mount agent routes tai `/internal/v1/agent`.
7. Python runtime stream event ve Go, Go proxy SSE line-by-line ve FE.
8. FE ghep cac event `assistant.delta` thanh text replacement.
9. Neu streaming fail, FE fallback sang non-stream endpoint `/api/v1/ai/inline-edit`.

### Flow agent run voi tool

1. FE hoac client goi `/api/v1/ai/runs`.
2. Go tao `run_id`, actor context, resource context, allowed tools va policy.
3. Python agent nhan request, tao run state trong memory.
4. Agent goi model streaming.
5. Neu model can tool, Python chay tool tu registry.
6. Tool private-note nhu `notes.read`, `notes.write`, `rag.search` goi nguoc ve Go internal tool endpoint.
7. Go internal endpoint validate service token va thuc thi tool tren DB.
8. Ket qua tool quay lai Python, Python tiep tuc model loop.
9. Python stream `tool.call`, `tool.result`, `assistant.delta`, `run.completed` hoac `run.failed`.

### Flow RAG indexing

1. Note create/update/snapshot trong backend goi `DispatchNoteSaved`.
2. `backend/internal/service/chunking_service.go` ban goroutine sang Python `/notes/embed-chunks`.
3. Python clean content, chunk note, goi embedding service.
4. Python tra chunks kem embeddings ve Go.
5. Backend persist vao bang `note_chunks`.
6. Khi agent can search private knowledge, Python tool `rag.search` tao query embedding va goi Go internal tool.
7. Go query pgvector trong `note_chunks` theo `user_id`, tinh score tu cosine distance va tra chunks ve agent.

### Nhan xet nhanh ve flow

- Kien truc tong the dung huong: FE streaming, Go proxy/auth, Python agent runtime, tool consent, RAG indexing.
- Go backend dang la boundary quan trong de bao ve note data.
- Python agent dang giu run state in-memory, phu hop MVP nhung chua phu hop multi-instance production.
- RAG indexing dang async fire-and-forget, de bi stale index neu AI service/embedding fail.
- Contract tool va payload dang bi phan tan giua FE, Go va Python.

## 2. Lam the nao de production-ready

Production-ready khong chi la model tra loi hay hon. He thong can co quyen han ro, state ben vung, indexing dang tin, observability va cost control.

### 2.1. Secure run ownership

Hien tai consent endpoint can duoc lam chat hon.

Production can:

- Persist moi `run_id` voi `user_id`, `workspace_id`, `session_id`, `note_id`.
- Moi consent decision phai verify user hien tai la owner cua run.
- Tool call phai gan voi run va actor.
- Khong cho approve/reject tool call chi dua tren `run_id` va `tool_call_id`.
- Internal AI token khong nen fail-open trong production.

Nen co bang hoac store:

```text
ai_runs
- id
- user_id
- workspace_id
- note_id
- session_id
- status
- created_at
- expires_at

ai_tool_calls
- id
- run_id
- tool_name
- input_summary
- status
- requires_consent
- approved_by
- approved_at
```

### 2.2. Durable run state

Python `RunRegistry` dang nam trong memory. Production can chuyen state sang Redis/Postgres.

Can luu:

- run metadata
- stream events
- pending consents
- tool calls
- token usage
- final result
- error code

Loi neu giu in-memory:

- Restart Python service mat pending consent.
- Multi-instance khong share state.
- User reconnect khong resume duoc.
- Khong audit duoc run sau khi xong.

### 2.3. Reliable RAG indexing

Hien indexing note la goroutine fire-and-forget. Production nen co outbox/queue.

Flow nen la:

```text
note saved
-> create indexing_job
-> worker chunk/embed
-> persist note_chunks
-> mark indexed
-> retry neu fail
```

Can track:

- `pending`
- `processing`
- `indexed`
- `failed`
- `stale`

Neu indexing fail, user van save note duoc, nhung he thong phai biet RAG dang stale.

### 2.4. Strict tool contract

Allowed tools hien dang duoc hardcode mot phan o Go, mot phan o Python. Nen gom contract thanh schema/version ro rang.

Moi tool can co:

- name
- description
- input schema
- output schema
- permission requirement
- consent requirement
- max latency
- retry behavior
- error codes

Vi du:

```json
{
  "name": "notes.write",
  "requires_consent": true,
  "input": {
    "note_id": "string",
    "operation": "replace | append | patch",
    "content": "string",
    "expected_version": "number"
  }
}
```

### 2.5. Human-in-the-loop write UX

Agent xu ly note khong nen tu sua truc tiep neu user chua thay thay doi.

Production nen co:

- preview diff
- summary thay doi
- affected note
- expected version
- approve/reject
- undo

Voi `notes.write`, nen uu tien patch co cau truc thay vi replace toan bo content.

### 2.6. Observability

Can trace ID xuyen suot:

```text
FE request
-> Go API
-> Python agent
-> OpenAI call
-> tool call
-> DB/vector query
-> response
```

Nen log structured:

- `trace_id`
- `run_id`
- `user_id`
- `workspace_id`
- model
- prompt version
- token usage
- latency tung stage
- tool call name
- tool result status
- RAG chunks used
- consent decision
- final status

Khong nen log full private note content neu chua co redaction.

### 2.7. Cost, quota va rate limit

Production can:

- per-user daily token quota
- per-workspace quota
- rate limit endpoint AI
- max selected text length
- max context blocks
- max RAG `top_k`
- max run duration
- circuit breaker khi OpenAI/embedding service loi

Payload hien co `quota`, nhung can noi voi usage/accounting that.

## 3. Tinh nang, system prompt va response quality

Agent nen duoc dinh nghia la private note assistant, khong phai chatbot tong quat.

Vai tro nen la:

```text
AI assistant duoc nhung trong note editor, giup user doc, viet, sua, to chuc va tim lai kien thuc ca nhan.
```

### 3.1. Cac mode tinh nang nen tach rieng

#### Inline transform

Dung khi user chon text va muon sua.

Actions:

- improve
- shorten
- expand
- rewrite
- translate
- make formal
- make concise
- fix grammar

Output nen la replacement text hoac structured response:

```json
{
  "replacement": "...",
  "changed_intent": false,
  "confidence": 0.91
}
```

#### Inline assist

Dung khi user chon text nhung khong muon replace truc tiep.

Actions:

- explain
- summarize
- brainstorm
- critique
- extract tasks

Output khong nen apply truc tiep vao editor, ma nen hien trong popover/sidebar.

#### Ask current note

Dung khi user hoi ve note hien tai.

Agent nen:

- doc note hien tai neu can
- tra loi dua tren noi dung note
- noi ro neu note khong co thong tin
- khong bia them noi dung rieng cua user

#### Search my notes

Dung khi user hoi ve kien thuc ca nhan qua nhieu note.

Agent nen:

- goi `rag.search`
- tong hop nhieu chunk
- tra ve sources
- noi ro khi khong tim thay

Response nen co:

```json
{
  "answer": "...",
  "sources": [
    {
      "note_id": "...",
      "snippet": "...",
      "score": 0.82
    }
  ],
  "missing_context": false
}
```

#### Write/apply mode

Dung khi agent sua note that su.

Can bat buoc:

- preview diff
- user approve
- expected version
- conflict handling
- undo path

### 3.2. System prompt nen co cau truc ro

Prompt production nen co cac phan:

```text
You are Mind Notion AI, an assistant embedded inside a private note-taking editor.

Primary goals:
1. Help users understand, edit, organize, and retrieve their own notes.
2. Preserve the user's meaning unless explicitly asked to transform it.
3. Use available tools when the answer depends on private notes.
4. Never invent note content that is not present in retrieved context.

Context rules:
- If the user asks about the current note, read the current note.
- If the user asks about past notes, memories, projects, or personal knowledge, use rag.search first.
- If retrieved context is insufficient, say what is missing.
- Do not use general knowledge to answer questions about the user's private notes unless clearly marked as general advice.

Editing rules:
- For inline edit, return only the replacement unless the caller requests explanation.
- Preserve language, tone, names, facts, Markdown/HTML structure where possible.
- Do not add new facts.
- Do not remove important constraints, dates, numbers, or decisions.
- If custom instruction conflicts with preserving meaning, follow the user instruction but keep factual integrity.

Tool rules:
- Read-only tools may be used without asking.
- Write tools require explicit user approval.
- Before notes.write, summarize exact change, affected note, and expected version.
- If a write fails due to version conflict, read the latest note and ask user to review a new diff.

Response quality:
- Be concise.
- Prefer structured output for editor operations.
- Cite note snippets when using RAG.
- Admit uncertainty.
```

### 3.3. Prompt rieng cho inline edit

Inline edit nen dung prompt rieng, ngan va chat.

```text
You are editing a selected passage inside a note editor.

Task:
Apply the requested action to selected_text.

Hard rules:
- Return only the edited replacement text.
- Preserve the original meaning unless the action explicitly asks otherwise.
- Preserve important names, numbers, dates, links, code, and decisions.
- Preserve the source language unless asked to translate.
- Do not mention that you are an AI.
- Do not wrap the answer in quotes.
- Do not add commentary.

Action:
{action}

Custom instruction:
{custom_prompt}

Selected text:
{selected_text}

Nearby context:
{context_blocks}
```

Can tach transform actions va assist actions de tranh response bi lan:

- Transform: tra replacement.
- Assist: tra explanation/analysis.

### 3.4. Response quality rubric

#### Inline edit quality

- Giu dung y goc.
- Khong them fact moi.
- Khong pha formatting.
- Khong doi ngon ngu ngoai y muon.
- Neu action la shorten, output phai ngan hon input.
- Neu action la fix grammar, khong rewrite qua muc.
- Khong kem commentary thua.

#### RAG answer quality

- Dung dung nguon note.
- Khong bia khi khong tim thay.
- Co snippet/source de user tin.
- Tong hop duoc nhieu chunk.
- Phan biet ro giua "tim thay trong note" va "suy luan".

#### Tool behavior quality

- Dung tool dung luc.
- Khong goi `notes.write` khi chi can tra loi.
- Khong goi web search cho private-note question.
- Khong spam tool calls.
- Tool loi thi giai thich ngan va actionable.

### 3.5. Pipeline xu ly note nen co

```text
user intent
-> classify task type
-> collect context
-> decide tools
-> generate answer/edit
-> validate output
-> return structured response
-> apply write only after consent
```

Task types nen co:

- `inline_transform`
- `inline_explain`
- `current_note_qa`
- `personal_knowledge_search`
- `note_write`
- `general_chat`
- `organize_note`

Output validation nen co:

- replacement khong rong
- khong vuot max length
- khong pha markdown/html
- action `shorten` khong dai hon input
- translate dung ngon ngu target
- write phai co expected version

## 4. Uu tien tiep theo

1. Persist `ai_runs` va bind run voi user/workspace.
2. Fix consent ownership.
3. Chuyen run registry sang Redis/Postgres.
4. Them indexing queue/outbox cho RAG.
5. Chuan hoa tool schema giua Go va Python.
6. Tach inline transform va inline assist response schema.
7. Them preview diff truoc khi `notes.write`.
8. Them evaluation set cho inline edit, RAG answer va tool behavior.

