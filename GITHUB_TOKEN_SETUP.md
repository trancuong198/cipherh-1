# GitHub Token Setup Guide - Hướng dẫn đầy đủ

## 🎯 TL;DR - Câu trả lời nhanh

### CÓ, bạn CẦN GitHub token!

**Tên biến môi trường:**
```bash
# Option 1: KHUYẾN NGHỊ
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Option 2: Cũng được (để tương thích)
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Code sẽ dùng theo thứ tự:**
1. `GITHUB_PERSONAL_ACCESS_TOKEN` (ưu tiên)
2. `GITHUB_TOKEN` (fallback)

---

## 📋 Khi nào CẦN GitHub Token?

### ✅ CẦN token khi:

1. **Bot tự động commit và push code**
   - Autonomous debugger fix bugs
   - Self-modification features
   - Auto-sync changes

2. **GitSync service**
   - Push changes to GitHub
   - Auto-commit features
   - Continuous integration

3. **Code modification features**
   - Bot sửa code của chính nó
   - Create/modify files
   - Commit changes

### ❌ KHÔNG CẦN token khi:

- Chỉ chạy bot local
- Không có auto-commit features
- Manual git operations only

---

## 🔐 Cách tạo GitHub Token

### Bước 1: Truy cập GitHub Settings

1. Đi đến: https://github.com/settings/tokens
2. Hoặc: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)

### Bước 2: Tạo token mới

1. Click **"Generate new token"** → **"Generate new token (classic)"**
2. Đặt tên: `CipherH Bot Token`
3. **Expiration:** Chọn thời hạn (khuyến nghị 90 days hoặc No expiration)

### Bước 3: Chọn Scopes (Quyền)

**MINIMUM required scopes:**
```
✅ repo               (Full control of private repositories)
  ✅ repo:status      (Access commit status)
  ✅ repo_deployment  (Access deployment status)
  ✅ public_repo      (Access public repositories)
  ✅ repo:invite      (Access repository invitations)
  ✅ security_events  (Read and write security events)
```

**Recommended scopes:**
```
✅ repo               (Full control)
✅ workflow           (Update GitHub Action workflows)
✅ write:packages     (Upload packages to GitHub Package Registry)
✅ read:org           (Read org and team membership)
```

**For GitHub Actions (if using CI/CD):**
```
✅ repo
✅ workflow
```

### Bước 4: Generate và Copy

1. Click **"Generate token"**
2. **QUAN TRỌNG:** Copy token NGAY (chỉ hiển thị 1 lần!)
3. Token sẽ có format: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## 🔧 Cách sử dụng Token

### Option 1: File .env (KHUYẾN NGHỊ)

```bash
# File: .env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Hoặc:
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Lưu ý:**
- `.env` file **KHÔNG BAO GIỜ** commit lên GitHub!
- Check `.gitignore` có dòng `.env`

### Option 2: Environment Variables (Production)

```bash
# Linux/Mac
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Windows
set GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Option 3: Render/Heroku Environment Variables

**Render.com:**
1. Dashboard → Service → Environment
2. Add: `GITHUB_TOKEN` = `ghp_xxx...`

**Heroku:**
```bash
heroku config:set GITHUB_TOKEN=ghp_xxx...
```

---

## 📝 Setup trong project

### 1. Create .env file

```bash
# Copy from example
cp .env.example .env

# Edit .env
nano .env
```

### 2. Add your token

```bash
# .env
NODE_ENV=production

# GitHub Token - CẦN cho auto-commit
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OpenAI - CẦN cho AI features
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Notion - CẦN cho memory
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional services
TELEGRAM_BOT_TOKEN=
TELEGRAM_OWNER_CHAT_ID=
FACEBOOK_PAGE_ACCESS_TOKEN=
FACEBOOK_PAGE_ID=
SESSION_SECRET=
```

### 3. Verify setup

```bash
# Check if token is loaded
npm run dev

# You should see in logs:
# [Config] GitHub: configured ✅
```

---

## 🔍 Code sử dụng Token như thế nào?

### gitSync.ts (Auto-commit & push)

```typescript
// server/services/gitSync.ts line 62-63
const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_TOKEN;
const pushUrl = `https://trancuong198:${token}@github.com/trancuong198/cipherh-1.git`;
```

**Giải thích:**
- Try `GITHUB_PERSONAL_ACCESS_TOKEN` first
- Fallback to `GITHUB_TOKEN`
- Use in HTTPS URL để push

### config.ts (Centralized config)

```typescript
// server/config.ts line 47
githubToken: getEnvString('GITHUB_PERSONAL_ACCESS_TOKEN') || getEnvString('GITHUB_TOKEN'),
```

---

## ⚠️ Security Best Practices

### ✅ DO:

1. **Bảo mật token:**
   - Không share token với ai
   - Không commit token vào code
   - Luôn dùng `.env` file

2. **Set expiration:**
   - Khuyến nghị: 90 days
   - Renew regularly
   - Rotate tokens định kỳ

3. **Minimum scopes:**
   - Chỉ grant quyền cần thiết
   - Don't grant admin access unless needed

4. **Monitor usage:**
   - Check GitHub audit log
   - Revoke compromised tokens immediately

### ❌ DON'T:

1. **KHÔNG BAO GIỜ:**
   - Commit token vào Git
   - Share token trong chat/email
   - Hard-code token trong code
   - Upload `.env` file lên GitHub

2. **Avoid:**
   - Using token in URLs (except for git push)
   - Logging token values
   - Storing in plain text outside `.env`

---

## 🔧 Troubleshooting

### Token không hoạt động

**1. Check token format:**
```
✅ Correct: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
❌ Wrong:   gho_xxx (OAuth)
❌ Wrong:   github_pat_xxx (Fine-grained - not supported yet)
```

**2. Check scopes:**
- Token needs `repo` scope minimum
- Re-generate with correct scopes

**3. Check expiration:**
- Token might be expired
- Generate new one

### Push bị từ chối

**Error:**
```
remote: Permission to repo denied
fatal: Authentication failed
```

**Solutions:**
1. Check token có `repo` scope
2. Check username trong push URL (`trancuong198`)
3. Check repository name correct
4. Verify token chưa revoked

### Token bị lộ

**Nếu token bị commit lên GitHub:**

1. **Revoke ngay:**
   - https://github.com/settings/tokens
   - Find token → Delete

2. **Generate new token**
3. **Update `.env` file**
4. **Clean git history** (nếu cần):
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all
   ```

---

## 📊 Token Usage trong CipherH

### Features using GitHub token:

1. **GitSync Service**
   - Auto-commit changes
   - Push to GitHub
   - Used by: autonomousDebugger, codeModification

2. **Autonomous Debugger**
   - Fix bugs → commit → push
   - Automatic code fixes

3. **Code Modification Service**
   - Self-modify code → commit → push
   - AI-powered changes

4. **Continuous Improvement**
   - Code improvements → commit → push
   - Evolution tracking

### Workflow:

```
Bot detects bug
    ↓
Generate fix
    ↓
Modify code (codeModificationService)
    ↓
Commit changes (gitSync with GITHUB_TOKEN)
    ↓
Push to GitHub (using token in HTTPS URL)
    ↓
Done ✅
```

---

## 🎯 Quick Setup Checklist

```
☐ 1. Tạo GitHub token tại https://github.com/settings/tokens
☐ 2. Chọn scopes: repo (minimum)
☐ 3. Copy token (ghp_xxx...)
☐ 4. Create .env file: cp .env.example .env
☐ 5. Add token: GITHUB_TOKEN=ghp_xxx...
☐ 6. Verify .env in .gitignore
☐ 7. Start bot: npm run dev
☐ 8. Check logs: "[Config] GitHub: configured"
☐ 9. Test auto-commit features
☐ 10. Keep token secure!
```

---

## 📚 Environment Variable Names

### Supported names (in order of priority):

```typescript
// Priority 1 (checked first)
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxx

// Priority 2 (fallback)
GITHUB_TOKEN=ghp_xxx
```

### Which one to use?

**Recommendation:**
```bash
# Use GITHUB_TOKEN (simpler, shorter)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Why both are supported?**
- `GITHUB_PERSONAL_ACCESS_TOKEN`: Original name
- `GITHUB_TOKEN`: GitHub standard name
- Code checks both for flexibility

---

## 🔥 Example .env file

```bash
# ===========================================
# CipherH Environment Configuration
# ===========================================

# Node Environment
NODE_ENV=production

# ===========================================
# REQUIRED: GitHub Token
# ===========================================
# Create at: https://github.com/settings/tokens
# Scopes needed: repo (full control)
# Used for: Auto-commit, auto-push, self-modification
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ===========================================
# REQUIRED: OpenAI API Key
# ===========================================
# Get from: https://platform.openai.com/api-keys
# Used for: AI features, bug fixing, code generation
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ===========================================
# REQUIRED: Notion Token
# ===========================================
# Create integration at: https://www.notion.so/my-integrations
# Used for: Memory storage, learning persistence
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ===========================================
# OPTIONAL: Telegram Bot
# ===========================================
# Create via @BotFather on Telegram
# Used for: Notifications, remote control
TELEGRAM_BOT_TOKEN=
TELEGRAM_OWNER_CHAT_ID=

# ===========================================
# OPTIONAL: Facebook Integration
# ===========================================
# Get from Facebook Graph API
# Used for: Posting to Facebook page
FACEBOOK_PAGE_ACCESS_TOKEN=
FACEBOOK_PAGE_ID=

# ===========================================
# OPTIONAL: Session Secret
# ===========================================
# Generate random string for production
# Used for: Session encryption
SESSION_SECRET=your-random-secret-string-here

# ===========================================
# OPTIONAL: Git Workflow Config
# ===========================================
# See GIT_WORKFLOW_OPTIONS.md for details
GIT_WORKFLOW_MODE=pull-request
GIT_TARGET_BRANCH=main
AUTO_MERGE_THRESHOLD=90
```

---

## 🎓 Summary

| Question | Answer |
|----------|--------|
| Có cần GitHub token? | **CÓ** - để auto-commit & push |
| Tên biến môi trường? | `GITHUB_TOKEN` (recommended) |
| Tên khác được không? | `GITHUB_PERSONAL_ACCESS_TOKEN` (also works) |
| Token format? | `ghp_xxx...` (classic PAT) |
| Scopes cần? | `repo` (minimum) |
| Đặt ở đâu? | `.env` file |
| Bảo mật? | **Không bao giờ commit!** |

---

**🔑 Token = Bot có thể tự động push code lên GitHub!**
**🛡️ Bảo mật token = Bảo vệ repository của bạn!**
