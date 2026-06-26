# TASK: Nang cap AI Agent cho Mind Notion

## Muc tieu

Bien AI agent hien tai thanh mot note-taking copilot production-ready: co mode ro rang, sua note theo diff/preview, RAG co nguon, tool an toan, co kha nang tu sua loi version conflict, va co nen tang de mo rong ve sau.

Agent khong nen di theo huong autonomous agent tu do. Huong dung la:

- Hoc tu coding agents: diff-first editing, permission tiers, self-correction.
- Hoc tu Notion AI/productivity agents: command routing, inline transform gon, preview/apply.
- Hoc tu deep research agents: grounded RAG, multi-step retrieval, citation.

## Nguyen tac thiet ke

1. User luon kiem soat thay doi tren note.
2. Read tool co the tu chay, write tool phai co consent.
3. Khong replace toan bo note neu co the patch/diff.
4. Cau tra loi ve private note phai co nguon hoac noi ro khong tim thay.
5. Moi mode co prompt rieng va output schema rieng.
6. Tool input/output phai structured va validate duoc.
7. Run phai gan voi user/workspace/session de audit va authorize.
8. Inline edit phai nhanh, ngan, giu y goc va khong noi thua.

## Phase 1: Diff-first edit proposal

### Muc tieu

Thay vi AI tra raw text va FE apply ngay, AI tra mot edit proposal co original/proposed/summary. FE render diff de user accept/reject.

### Schema de xuat

```json
{
  "type": "edit_proposal",
  "operation": "replace",
  "target": {
    "note_id": "string",
    "expected_version": 12,
    "selection_id": "optional-string"
  },
  "original": "string",
  "proposed": "string",
  "summary": "string",
  "preserved": ["string"],
  "confidence": 0.9
}
```

### Viec can lam

- FE: them UI preview diff cho inline edit proposal.
- FE: user co nut Accept / Reject.
- FE: khong apply replacement neu chua co accept.
- BE: them response DTO/schema cho edit proposal.
- Python: inline edit co the tra structured proposal thay vi raw text.
- Python: validate `proposed` khong rong va khong pha constraint co ban.

### Acceptance criteria

- User chon text va chay improve/shorten se thay diff preview.
- Accept moi apply vao editor.
- Reject khong thay doi editor.
- Proposal co summary ngan.
- Action `shorten` khong duoc tra output dai hon input neu khong co ly do ro.

## Phase 2: Mode routing va command registry

### Muc tieu

Khong de mot prompt chung doan tat ca intent. Tao command registry: moi command co mode, prompt, input schema, output schema.

### Commands ban dau

| Command | Mode | Output |
|---|---|---|
| `/improve` | inline_transform | `{ replacement }` hoac `edit_proposal` |
| `/shorten` | inline_transform | `{ replacement }` hoac `edit_proposal` |
| `/expand` | inline_transform | `{ replacement }` hoac `edit_proposal` |
| `/translate` | inline_transform | `{ replacement, target_language }` |
| `/explain` | inline_assist | `{ explanation }` |
| `/summarize` | inline_assist/current_note | `{ summary, bullets }` |
| `/tasks` | extract | `{ tasks[] }` |
| `/ask` | current_note_qa | `{ answer, sources[] }` |
| `/find` | personal_knowledge_search | `{ answer, sources[] }` |

### Viec can lam

- Tao command registry o FE hoac shared package.
- Map editor menu/slash command sang command id.
- BE/Python nhan `mode` va `command` thay vi chi `action`.
- Prompt rieng cho transform, assist, QA, RAG.
- Output schema rieng cho tung mode.

### Acceptance criteria

- `/improve` chi tra noi dung edit, khong giai thich thua.
- `/explain` khong apply vao editor nhu replacement.
- `/find` bat buoc dung RAG va co sources.
- Command moi co the them bang registry, khong can sua prompt chung lon.

## Phase 3: Structured output va validation

### Muc tieu

Moi response quan trong cua AI phai co schema va duoc validate truoc khi tra ve FE hoac apply write.

### Schemas can co

```text
InlineTransformResult
InlineAssistResult
EditProposal
RAGAnswer
ToolCallRequest
ToolCallResult
ConsentRequest
ConsentDecision
```

### Validation can co

- `replacement`/`proposed` khong rong.
- `confidence` nam trong 0..1.
- `sources[]` bat buoc khi mode la RAG.
- `expected_version` bat buoc khi write note.
- `note_id` bat buoc voi apply/write.
- Tool args phai match schema.

### Acceptance criteria

- AI response sai schema se thanh `run.failed` voi code ro rang.
- FE khong phai parse free-text de biet response la edit hay answer.
- Khong con `any` o client AI streaming body neu co type generated phu hop.

## Phase 4: Run ownership va consent binding

### Muc tieu

Moi AI run phai duoc bind voi user/workspace/session. Consent phai verify owner, khong chi forward `run_id`.

### Viec can lam

- Tao persisted `ai_runs`.
- Tao persisted `ai_tool_calls`.
- Khi tao run, luu `run_id`, `user_id`, `workspace_id`, `note_id`, `session_id`, status.
- Khi tool can consent, luu pending tool call.
- `PATCH /ai/runs/:run_id/consent` phai:
  - require auth user
  - load run
  - verify run.user_id == current user
  - verify tool_call_id thuoc run
  - forward decision sang Python

### Acceptance criteria

- User A khong the approve run cua user B.
- Consent khong hop le tra 403/404.
- Moi consent duoc audit voi approved_by/approved_at.

## Phase 5: Grounded multi-step RAG

### Muc tieu

Nang RAG tu search mot lan thanh retrieval loop nho, co citation va noi ro khi khong tim thay.

### Flow de xuat

```text
user question
-> classify as private-note question
-> decompose neu phuc tap
-> rag.search lan 1
-> evaluate coverage
-> refine query neu thieu
-> max 3 searches
-> synthesize answer with sources
```

### RAG answer schema

```json
{
  "answer": "string",
  "sources": [
    {
      "note_id": "string",
      "chunk_index": 0,
      "snippet": "string",
      "score": 0.82
    }
  ],
  "missing_context": false,
  "confidence": 0.84
}
```

### Viec can lam

- Them RAG answer schema.
- Them citations vao output.
- Cho phep agent search refined query toi da 3 lan.
- RAG search filter them `workspace_id` neu workspace da la domain that.
- FE hien sources/snippets.

### Acceptance criteria

- Cau hoi ve private note khong tra general answer neu khong co source.
- Neu khong tim thay, response noi ro "khong tim thay trong note cua ban".
- Moi claim quan trong trong RAG answer co source tu note/chunk.

## Phase 6: Self-correction cho version conflict

### Muc tieu

Neu `notes.write` fail vi `VERSION_CONFLICT`, agent tu doc note moi nhat va tao edit proposal moi.

### Flow

```text
notes.write
-> VERSION_CONFLICT
-> notes.read latest
-> recompute proposal on latest content
-> return new diff to user
```

### Acceptance criteria

- Khong mat thay doi cua user khac khi note da doi.
- User nhan duoc diff moi dua tren latest version.
- Agent khong retry write truc tiep khi chua co consent moi.

## Phase 7: Durable run state va resume

### Muc tieu

Thay in-memory run registry bang Redis/Postgres de support multi-instance, restart va reconnect.

### Viec can lam

- Persist run events.
- Persist pending consents.
- Them event id/resume token.
- SSE support reconnect bang `Last-Event-ID` hoac resume token.
- Cleanup expired runs.

### Acceptance criteria

- Restart Python service khong lam mat audit trail.
- User reconnect co the lay lai events gan nhat.
- Pending consent co TTL va status ro rang.

## Phase 8: Eval suite cho response quality

### Muc tieu

Do chat luong agent theo tung mode, tranh regression khi sua prompt/model.

### Eval cases can co

#### Inline transform

- Improve van ban tieng Viet.
- Shorten van ban nhung giu so lieu/ngay thang.
- Translate nhung giu ten rieng.
- Fix grammar khong doi y.
- Preserve markdown/list/code.

#### RAG QA

- Cau hoi co source ro.
- Cau hoi khong co trong note.
- Cau hoi can tong hop nhieu note.
- Cau hoi co chunk nhieu diem mau thuan.

#### Tool behavior

- Read note dung luc.
- Khong write khi user chi hoi.
- Write can consent.
- Version conflict tao proposal moi.

### Acceptance criteria

- Co script chay eval local.
- Moi eval case co expected behavior.
- Prompt thay doi phai chay eval truoc khi merge.

## File/code areas du kien

### Frontend

- `apps/web/shared/components/RichTextEditor/RichTextEditor.tsx`
- `apps/web/shared/services/ai/inline-edit.ts`
- `apps/web/shared/services/ai/stream-ai-run.ts`
- editor UI package neu diff preview nam trong package editor

### Backend Go

- `backend/internal/handlers/ai_run_handler.go`
- `backend/internal/handlers/ai_internal_handler.go`
- `backend/openapi/paths/ai/*`
- `backend/openapi/components/schemas/AI/*`
- repositories/models moi cho `ai_runs`, `ai_tool_calls`

### Python AI services

- `ai-services/src/ai_services/agent/api_contracts.py`
- `ai-services/src/ai_services/agent/api_runtime.py`
- `ai-services/src/ai_services/agent/run_inline_edit.py`
- `ai-services/src/ai_services/agent/run.py`
- `ai-services/src/ai_services/agent/tools/*`
- prompt files under `ai-services/src/ai_services/agent/system/*`

## Thu tu uu tien de lam

1. Run ownership + consent binding.
2. Diff-first edit proposal.
3. Mode routing + prompt rieng.
4. Structured output validation.
5. Self-correction cho version conflict.
6. Grounded RAG with citations.
7. Durable run state/resume.
8. Eval suite.

## Definition of Done

AI agent duoc coi la production-ready cho note workflow khi:

- Inline edit luon co preview/diff hoac schema replacement ro rang.
- User accept moi apply thay doi vao editor.
- Write tool luon can consent va verify owner.
- RAG answer co sources hoac noi ro khong tim thay.
- Tool args va AI response duoc validate schema.
- Version conflict khong ghi de noi dung moi cua user.
- Run state co audit trail.
- Co eval suite cho cac mode chinh.

