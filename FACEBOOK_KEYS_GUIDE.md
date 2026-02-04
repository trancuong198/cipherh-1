# Hướng Dẫn Chi Tiết: Lấy Key Facebook Để Đăng Bài

## 🎯 TL;DR - Câu trả lời nhanh

### Cần 2 KEY để đăng bài Facebook:

```bash
# File: .env
FACEBOOK_PAGE_ACCESS_TOKEN=******
FACEBOOK_PAGE_ID=123456789012345
```

---

## 📋 Chi tiết từng KEY

### 1. FACEBOOK_PAGE_ACCESS_TOKEN

**Là gì?**
- Token (mã truy cập) để bot có quyền đăng bài lên Facebook Page
- Format: Chuỗi ký tự dài ~200 chars
- Có thời hạn: 60 ngày (long-lived token)

**Dùng để làm gì?**
- Đăng bài lên Facebook Page
- Đọc comments
- Tự động reply comments
- Lấy thông tin page

### 2. FACEBOOK_PAGE_ID

**Là gì?**
- ID duy nhất của Facebook Page
- Format: Số, ví dụ: `123456789012345`

**Dùng để làm gì?**
- Xác định page nào sẽ đăng bài
- API biết đăng lên page nào

---

## 🔐 Cách lấy FACEBOOK_PAGE_ACCESS_TOKEN (Chi tiết)

### Phương án 1: Graph API Explorer (Khuyến nghị - Dễ nhất)

#### Bước 1: Tạo Facebook App

1. Vào: https://developers.facebook.com/apps
2. Click **"Create App"**
3. Chọn type: **"Business"** hoặc **"Other"**
4. Điền thông tin:
   - App name: `CipherH Bot`
   - App contact email: email của bạn
5. Click **"Create App"**

#### Bước 2: Add Product - Facebook Login

1. Trong Dashboard app, tìm **"Facebook Login"**
2. Click **"Set Up"**
3. Chọn **"Web"**
4. Site URL: `https://localhost` (tạm thời)
5. Save settings

#### Bước 3: Get Page Access Token

1. Vào: https://developers.facebook.com/tools/explorer/
2. Trong **"Meta App"** dropdown: Chọn app vừa tạo
3. Trong **"User or Page"** dropdown: Chọn **"Get Page Access Token"**
4. Chọn Facebook Page của bạn từ danh sách
5. Grant permissions (chọn tất cả):
   - ✅ `pages_show_list` - Xem danh sách pages
   - ✅ `pages_read_engagement` - Đọc engagement (likes, comments)
   - ✅ `pages_manage_posts` - Đăng và quản lý posts
   - ✅ `pages_read_user_content` - Đọc user content
   - ✅ `pages_manage_engagement` - Quản lý engagement
6. Click **"Generate Access Token"**
7. **COPY TOKEN NGAY!** (token này là short-lived - chỉ sống 1 giờ)

#### Bước 4: Convert to Long-Lived Token (60 ngày)

**Option A: Access Token Debugger (Dễ nhất)**

1. Vào: https://developers.facebook.com/tools/debug/accesstoken/
2. Paste token vừa copy vào
3. Click **"Debug"**
4. Ở dưới cùng, click **"Extend Access Token"**
5. Copy **long-lived token** mới (60 ngày)

**Option B: API Call (Advanced)**

```bash
curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=SHORT_LIVED_TOKEN"
```

Thay thế:
- `YOUR_APP_ID`: App ID (trong Dashboard app)
- `YOUR_APP_SECRET`: App Secret (trong Dashboard → Settings → Basic)
- `SHORT_LIVED_TOKEN`: Token từ Graph Explorer

Response:
```json
{
  "access_token": "LONG_LIVED_TOKEN_HERE",
  "token_type": "bearer"
}
```

#### Bước 5: Get Page Access Token từ User Token

Nếu bạn có user access token, convert sang page token:

```bash
curl -X GET "https://graph.facebook.com/v18.0/me/accounts?access_token=USER_ACCESS_TOKEN"
```

Response sẽ có list pages với `access_token` cho mỗi page.

---

### Phương án 2: Manual Process (Chi tiết hơn)

#### Step 1: Create Facebook App

1. Go to: https://developers.facebook.com/
2. Click **"My Apps"** → **"Create App"**
3. Select use case: **"Other"**
4. Select app type: **"Business"**
5. Fill details:
   ```
   Display Name: CipherH Bot
   Contact Email: your@email.com
   ```
6. Complete security check → **"Create App"**

#### Step 2: Configure Facebook Login

1. Dashboard → **"Add Product"** → **"Facebook Login"** → **"Setup"**
2. Select **"Web"**
3. Settings:
   ```
   Valid OAuth Redirect URIs: https://localhost/
   ```
4. Save Changes

#### Step 3: App Review (Nếu cần publish)

1. Dashboard → **"App Review"** → **"Permissions and Features"**
2. Request permissions:
   - `pages_manage_posts` - Required for posting
   - `pages_read_engagement` - Required for reading
   - `pages_show_list` - Required for listing pages
3. Submit for review (có thể mất vài ngày)

**LƯU Ý:** Cho development, không cần review. App ở chế độ Development vẫn hoạt động được với Admins/Developers/Testers.

#### Step 4: Get Token via Graph API

```javascript
// Node.js example
const fetch = require('node-fetch');

async function getPageToken() {
  // 1. Get short-lived user token from Graph Explorer
  const shortUserToken = 'SHORT_USER_TOKEN_FROM_GRAPH_EXPLORER';
  
  // 2. Exchange for long-lived user token
  const longUserTokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET&fb_exchange_token=${shortUserToken}`;
  
  const response1 = await fetch(longUserTokenUrl);
  const data1 = await response1.json();
  const longUserToken = data1.access_token;
  
  // 3. Get page access token
  const pageTokenUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${longUserToken}`;
  
  const response2 = await fetch(pageTokenUrl);
  const data2 = await response2.json();
  
  // 4. Find your page
  const page = data2.data.find(p => p.name === 'YOUR_PAGE_NAME');
  console.log('Page Access Token:', page.access_token);
  console.log('Page ID:', page.id);
}
```

---

## 🔍 Cách lấy FACEBOOK_PAGE_ID

### Phương án 1: Từ URL

Vào Facebook Page của bạn và xem URL:

```
https://www.facebook.com/YOUR_PAGE_NAME
hoặc
https://www.facebook.com/profile.php?id=123456789012345
```

Nếu URL có `id=`, đó là Page ID của bạn!

### Phương án 2: Page Info

1. Vào Facebook Page
2. Click **"About"** (Giới thiệu)
3. Scroll xuống, tìm **"Page ID"**

### Phương án 3: Graph API

```bash
curl "https://graph.facebook.com/v18.0/me/accounts?access_token=YOUR_USER_TOKEN"
```

Response:
```json
{
  "data": [
    {
      "id": "123456789012345",  // ← Đây là Page ID
      "name": "Your Page Name",
      "access_token": "page_access_token_here"
    }
  ]
}
```

### Phương án 4: Graph API Explorer

1. Vào: https://developers.facebook.com/tools/explorer/
2. Chọn app của bạn
3. Trong query field, nhập: `/me/accounts`
4. Click **"Submit"**
5. Xem kết quả, tìm `id` field

---

## 🔧 Setup trong Project

### Bước 1: Create .env file

```bash
# Copy from example
cp .env.example .env
```

### Bước 2: Add Facebook credentials

```bash
# File: .env

# ... các biến khác ...

# ===========================================
# Facebook Integration (OPTIONAL)
# ===========================================
# Page Access Token (60-day long-lived token)
FACEBOOK_PAGE_ACCESS_TOKEN=******

# Page ID (numeric)
FACEBOOK_PAGE_ID=123456789012345
```

### Bước 3: Restart application

```bash
npm start
```

### Bước 4: Verify trong logs

Bạn sẽ thấy:
```
[Facebook] Connected to page: Your Page Name
[Facebook] Service initialized successfully ✓
```

---

## ✅ Test kết nối

### Test Script

```bash
# Chạy test script có sẵn
node test-facebook.js "Test post from CipherH! 🤖"
```

Expected output:
```
Testing Facebook integration...
✅ Success! Post published
Post ID: 123456789_987654321
View: https://www.facebook.com/123456789_987654321
```

### Manual Test via API

```bash
curl -X POST "https://graph.facebook.com/v18.0/PAGE_ID/feed" \
  -d "message=Test post&access_token=PAGE_ACCESS_TOKEN"
```

---

## 🔐 Permissions Required

Token cần có các permissions sau:

### Essential (Bắt buộc):
- ✅ `pages_manage_posts` - Để đăng bài
- ✅ `pages_show_list` - Để xem danh sách pages
- ✅ `pages_read_engagement` - Để đọc engagement

### Optional (Tùy chọn):
- `pages_read_user_content` - Để đọc content từ users
- `pages_manage_engagement` - Để quản lý comments, replies
- `publish_video` - Nếu muốn đăng video

### How to check permissions:

```bash
curl "https://graph.facebook.com/v18.0/me/permissions?access_token=YOUR_TOKEN"
```

---

## ⚠️ Troubleshooting

### 1. "Facebook not configured"

**Nguyên nhân:**
- Thiếu `FACEBOOK_PAGE_ACCESS_TOKEN` hoặc `FACEBOOK_PAGE_ID`
- Biến môi trường không được load

**Giải pháp:**
```bash
# Check biến đã set chưa
echo $FACEBOOK_PAGE_ACCESS_TOKEN
echo $FACEBOOK_PAGE_ID

# Restart application
npm start
```

### 2. "Token verification failed"

**Nguyên nhân:**
- Token đã hết hạn (60 days)
- Token không hợp lệ
- Token không có đúng permissions

**Giải pháp:**
1. Check token expiry:
   ```bash
   curl "https://graph.facebook.com/v18.0/debug_token?input_token=YOUR_TOKEN&access_token=APP_TOKEN"
   ```

2. Generate new token (Bước 3 ở trên)

### 3. "Invalid OAuth access token"

**Nguyên nhân:**
- Format token sai
- Dùng User Token thay vì Page Token
- Token bị revoke

**Giải pháp:**
- Verify token type:
  ```bash
  curl "https://graph.facebook.com/v18.0/me?access_token=YOUR_TOKEN"
  ```
  Phải trả về page info, không phải user info

### 4. "(#200) Insufficient permissions"

**Nguyên nhân:**
- Token thiếu permissions cần thiết

**Giải pháp:**
1. Regenerate token với đầy đủ permissions
2. Check permissions:
   ```bash
   curl "https://graph.facebook.com/v18.0/me/permissions?access_token=YOUR_TOKEN"
   ```

### 5. "Application request limit reached"

**Nguyên nhân:**
- Vượt rate limit của Facebook API
  - 200 calls/hour per user
  - 4800 calls/day per app

**Giải pháp:**
- Wait và retry sau
- Implement rate limiting trong code

### 6. Token format không đúng

**Đúng:**
```
EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx... (dài ~200 chars)
```

**Sai:**
```
YOUR_TOKEN_HERE
token123
ghp_xxx (đây là GitHub token!)
```

---

## 🔒 Security Best Practices

### ✅ DO:

1. **Bảo mật token:**
   - Luôn dùng `.env` file
   - KHÔNG commit token vào Git
   - Add `.env` vào `.gitignore`

2. **Token expiration:**
   - Set reminder để renew token (55 ngày)
   - Monitor token expiry date
   - Use long-lived tokens (60 days)

3. **Minimum permissions:**
   - Chỉ grant permissions cần thiết
   - Review permissions định kỳ

4. **App security:**
   - Enable 2FA cho Facebook account
   - Use strong passwords
   - Monitor app activity

### ❌ DON'T:

1. **KHÔNG BAO GIỜ:**
   - Commit token vào Git repository
   - Share token trong chat/email
   - Hard-code token trong source code
   - Post token lên social media

2. **Tránh:**
   - Dùng token trong URLs công khai
   - Log token values
   - Share app secret

---

## 📊 Token Types Comparison

| Type | Lifetime | Usage | Best For |
|------|----------|-------|----------|
| **Short-lived User** | 1 hour | Testing | Development |
| **Long-lived User** | 60 days | Personal use | Testing |
| **Page Access Token** | 60 days | Bot posting | **Production** ✅ |
| **Never-expiring** | Forever | Legacy only | Not recommended |

**Recommendation:** Use **Page Access Token** (60-day) cho production.

---

## 🎓 Example .env File

```bash
# ===========================================
# CipherH Environment Configuration
# ===========================================

NODE_ENV=production

# GitHub Token (for auto-commit)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OpenAI (for AI features)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Notion (for memory)
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ===========================================
# Facebook Integration
# ===========================================
# QUAN TRỌNG: Dùng Page Access Token, không phải User Token!
# Token phải có permissions: pages_manage_posts, pages_read_engagement
# Token hết hạn sau 60 ngày - cần renew!
# 
# Get token: https://developers.facebook.com/tools/explorer/
# Debug token: https://developers.facebook.com/tools/debug/accesstoken/

# Long-lived Page Access Token (60 days)
FACEBOOK_PAGE_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Page ID (numeric - find in Page About section)
FACEBOOK_PAGE_ID=123456789012345

# Optional: Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_OWNER_CHAT_ID=

# Session Secret
SESSION_SECRET=your-random-secret-here
```

---

## 📝 Quick Checklist

```
☐ 1. Tạo Facebook App tại https://developers.facebook.com/
☐ 2. Add Facebook Login product
☐ 3. Get short-lived token từ Graph API Explorer
☐ 4. Grant permissions: pages_manage_posts, pages_read_engagement, pages_show_list
☐ 5. Convert to long-lived token (60 days)
☐ 6. Get Page ID từ page URL hoặc Graph API
☐ 7. Add to .env: FACEBOOK_PAGE_ACCESS_TOKEN và FACEBOOK_PAGE_ID
☐ 8. Verify .env trong .gitignore
☐ 9. Restart app: npm start
☐ 10. Check logs: "[Facebook] Connected to page..."
☐ 11. Test: node test-facebook.js "Test message"
☐ 12. Set reminder để renew token sau 55 ngày
```

---

## 🚀 Sau khi Setup

Bot sẽ có khả năng:
- ✅ Tự động đăng bài lên Facebook Page
- ✅ Đọc comments từ audience
- ✅ Tự động reply comments (với SOUL!)
- ✅ Schedule posts
- ✅ Học từ engagement (likes, comments)
- ✅ Tạo content phù hợp với audience

---

## 📚 Tài liệu tham khảo

### Official Facebook Docs:
- Graph API: https://developers.facebook.com/docs/graph-api/
- Page API: https://developers.facebook.com/docs/pages
- Access Tokens: https://developers.facebook.com/docs/facebook-login/guides/access-tokens/

### CipherH Docs:
- English guide: `FACEBOOK_SETUP.md`
- Vietnamese guide: `FACEBOOK_VI.md`
- Test script: `test-facebook.js`
- Service code: `server/services/facebook.ts`

---

## 🎯 Tóm tắt

| Câu hỏi | Trả lời |
|---------|---------|
| Cần mấy key? | **2 keys** |
| Key 1? | `FACEBOOK_PAGE_ACCESS_TOKEN` |
| Key 2? | `FACEBOOK_PAGE_ID` |
| Lấy ở đâu? | Facebook Developers + Graph API Explorer |
| Format token? | EAAxxxx... (~200 chars) |
| Format Page ID? | Số (numeric) |
| Permissions? | `pages_manage_posts`, `pages_read_engagement` |
| Token hết hạn? | 60 ngày (long-lived) |
| Đặt ở đâu? | `.env` file |
| Commit được không? | **KHÔNG** - Security risk! |

---

**🎉 Sau khi setup → Bot có thể tự động đăng bài Facebook!**
**🔐 Nhớ bảo mật token → Không bao giờ commit .env file!**
