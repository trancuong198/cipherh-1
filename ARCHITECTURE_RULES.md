# CipherH Architecture Rules

## Refactoring Guidelines (2026-02-06)

### ❌ KHÔNG ĐƯỢC PHÉP

1. **Không thêm logic mới**
   - Không thêm tính năng mới
   - Không thêm business logic mới
   - Không làm hệ thống "thông minh hơn"

2. **Không thêm prompt awareness**
   - Không thêm self-awareness text
   - Không thêm context awareness mới
   - Không thêm system prompt mới

3. **Không thêm role-play text**
   - Không thêm personality text
   - Không thêm emotional responses
   - Không thêm character development

4. **Không thêm biến mới** (trừ khi được yêu cầu cụ thể)
   - Không tạo state mới
   - Không tạo configuration mới
   - Chỉ di chuyển biến hiện có

### ✅ CHỈ ĐƯỢC PHÉP

1. **Tái cấu trúc (Refactoring)**
   - Extract functions/classes
   - Rename for clarity
   - Simplify complex logic
   - Remove duplication

2. **Di chuyển logic đúng tầng**
   - Route handlers → chỉ orchestrate
   - Business logic → core services
   - Data access → repositories
   - Session management → services

3. **Giữ nguyên hành vi hiện tại**
   - Behavior PHẢI giống 100%
   - API contracts không thay đổi
   - Side effects không thay đổi
   - Performance tương đương

## Architectural Layers

```
┌─────────────────────────────────────┐
│  Routes (server/routes/)            │ ← HTTP handling only
│  - Validate requests                │
│  - Call services                    │
│  - Return responses                 │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Core Services (server/core/)       │ ← Business logic
│  - Domain logic                     │
│  - Orchestration                    │
│  - State management                 │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Services (server/services/)        │ ← External integrations
│  - OpenAI                           │
│  - Notion                           │
│  - Telegram/Facebook                │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Storage (server/storage.ts, etc)  │ ← Data persistence
└─────────────────────────────────────┘
```

## Current Issues to Fix

### server/routes/core.ts (903 lines)
- ❌ Contains session management logic → Move to `services/sessionManager.ts`
- ❌ Contains business logic (gatherSystemContext, gatherMemoryContext) → Move to `core/contextGatherer.ts`
- ❌ Contains presentation logic (massive prompt building) → Simplify
- ❌ Contains service logic (saveConversationToNotion) → Move to service

## Goals

- ✅ Kiến trúc ĐÚNG TẦNG hơn
- ✅ Code dễ maintain
- ✅ Separation of concerns
- ❌ KHÔNG làm backend thông minh hơn
- ❌ KHÔNG thêm features

## Review Checklist

Before merging refactoring PR, verify:
- [ ] No new business logic added
- [ ] No new prompt/awareness text
- [ ] No new variables (unless explicitly requested)
- [ ] Behavior unchanged (test existing features)
- [ ] Code moved to correct architectural layer
- [ ] Reduced complexity in route handlers
