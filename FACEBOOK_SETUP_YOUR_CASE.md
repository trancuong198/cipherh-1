# Hướng Dẫn Setup Facebook Cho Trường Hợp Của Bạn

## 📋 Hiện trạng của bạn

Bạn có **2 Facebook Apps:**

### App 1: "vô"
```
App Name: vô
App ID: 1280719510550809
Chế độ: Hoạt động (Active)
Loại: Kinh doanh (Business)
Doanh nghiệp: VO ANH
```

### App 2: "VoAnh CommandCenter"
```
App Name: VoAnh CommandCenter
App ID: 1944661492953854
Chế độ: Đang phát triển (Development)
Doanh nghiệp: VO ANH
```

---

## ⚠️ QUAN TRỌNG: App ID ≠ Page ID!

**Cả 2 App IDs này KHÔNG PHẢI là Page ID!**

Để đăng bài Facebook, bạn cần:
- ❌ KHÔNG cần: App ID
- ✅ CẦN: **Page ID** (ID của trang Facebook)
- ✅ CẦN: **Page Access Token** (Mã truy cập trang)

---

## 🎯 Lựa chọn App nào?

### Khuyến nghị: Dùng **"VoAnh CommandCenter"** (1944661492953854)

**Lý do:**
- ✅ Tên rõ ràng, dễ quản lý
- ✅ Development mode - phù hợp cho testing
- ✅ Có thể switch sang production sau

**App "vô"** cũng OK nhưng tên khó nhớ.

---

## 📝 HƯỚNG DẪN CHI TIẾT - Lấy Page ID và Token

### Bước 1: Chuẩn bị App

1. Vào: https://developers.facebook.com/apps/1944661492953854/
2. Click vào app **"VoAnh CommandCenter"**
3. Trong sidebar trái, tìm **"Facebook Login"**
4. Nếu chưa có, click **"Set Up"** để add Facebook Login

### Bước 2: Get Page Access Token (Chuẩn nhất!)

#### Option A: Graph API Explorer (KHUYẾN NGHỊ)

1. **Mở Graph API Explorer:**
   - URL: https://developers.facebook.com/tools/explorer/
   - Hoặc từ app dashboard → Tools → Graph API Explorer

2. **Chọn App:**
   - Trong dropdown **"Meta App"** (góc trên bên phải)
   - Chọn: **"VoAnh CommandCenter"** (1944661492953854)

3. **Get Token:**
   - Click button **"Get Token"** (hoặc "Get User Access Token")
   - Dropdown hiện ra, chọn: **"Get Page Access Token"**
   
4. **Chọn Page:**
   - Danh sách Facebook Pages của bạn sẽ hiện ra
   - ✅ **CHỌN TRANG FACEBOOK BẠN MUỐN POST**
   - Click vào trang đó

5. **Grant Permissions:**
   - Hệ thống sẽ hỏi cho phép:
     - ✅ `pages_show_list` - Xem danh sách trang
     - ✅ `pages_read_engagement` - Đọc tương tác
     - ✅ `pages_manage_posts` - Quản lý bài viết
   - Click **"Continue"** hoặc **"OK"**

6. **COPY THÔNG TIN:**
   
   Sau khi grant, bạn sẽ thấy:
   
   **a) Page Access Token (trong "Access Token" field):**
   ```
   EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx...
   (Chuỗi dài ~200 ký tự)
   ```
   
   **b) Page ID - Tìm bằng cách:**
   - Trong query box, xóa hết
   - Gõ: `/me?fields=id,name`
   - Click **"Submit"**
   - Kết quả:
     ```json
     {
       "id": "123456789012345",  ← ĐÂY LÀ PAGE ID!
       "name": "Tên trang Facebook của bạn"
     }
     ```

#### Option B: Dùng /me/accounts (Xem tất cả pages)

1. Trong Graph API Explorer (đã chọn app "VoAnh CommandCenter")
2. Click **"Get Token"** → **"Get User Access Token"** (không phải Page Token lần này)
3. Grant permissions: `pages_show_list`, `pages_manage_posts`, `pages_read_engagement`
4. Trong query box, gõ: `/me/accounts`
5. Click **"Submit"**
6. Kết quả hiển thị **TẤT CẢ** pages và tokens của bạn:
   ```json
   {
     "data": [
       {
         "id": "123456789012345",           ← PAGE ID của trang 1
         "name": "Tên trang Facebook 1",
         "access_token": "EAAxxxx...",      ← PAGE TOKEN của trang 1
         "category": "...",
         "tasks": ["ANALYZE", "ADVERTISE", "MODERATE", "CREATE_CONTENT", "MANAGE"]
       },
       {
         "id": "987654321098765",           ← PAGE ID của trang 2 (nếu có)
         "name": "Tên trang Facebook 2",
         "access_token": "EAAyyyy...",      ← PAGE TOKEN của trang 2
         ...
       }
     ]
   }
   ```

7. **CHỌN TRANG BẠN MUỐN:**
   - Tìm trang Facebook bạn muốn bot đăng bài
   - Copy **`id`** → Đây là **PAGE ID**
   - Copy **`access_token`** → Đây là **PAGE ACCESS TOKEN**

---

### Bước 3: Convert to Long-Lived Token (60 ngày)

Token vừa lấy chỉ sống **1-2 giờ**. Cần convert thành **60 ngày**:

1. **Vào Access Token Debugger:**
   - URL: https://developers.facebook.com/tools/debug/accesstoken/
   
2. **Paste Token:**
   - Paste **Page Access Token** vừa copy
   - Click **"Debug"**

3. **Check Info:**
   - Bạn sẽ thấy thông tin token:
     - Type: Page
     - Page: [Tên trang]
     - Expires: [Thời gian hết hạn]

4. **Extend Token:**
   - Scroll xuống, click button **"Extend Access Token"**
   - Token mới sẽ có expires = **60 days**
   - ✅ **COPY TOKEN MỚI NÀY**

---

### Bước 4: Verify Token và Page ID

**Test 1: Check token có hợp lệ không**

```bash
# Thay YOUR_TOKEN bằng token bạn vừa copy
# Thay YOUR_PAGE_ID bằng page ID bạn vừa copy

curl "https://graph.facebook.com/v18.0/YOUR_PAGE_ID?access_token=YOUR_TOKEN"

# Kết quả mong đợi:
{
  "id": "123456789012345",
  "name": "Tên trang Facebook của bạn"
}

# Nếu có error → token hoặc page ID sai
```

**Test 2: Thử post test message**

```bash
curl -X POST "https://graph.facebook.com/v18.0/YOUR_PAGE_ID/feed" \
  -d "message=Test post from CipherH Bot 🤖" \
  -d "access_token=YOUR_TOKEN"

# Kết quả mong đợi:
{
  "id": "123456789_987654321"  # Post ID
}

# Check trang Facebook → bài post sẽ xuất hiện!
```

---

### Bước 5: Add vào .env File

```bash
# File: .env

# ===========================================
# Facebook Integration
# ===========================================
# App: VoAnh CommandCenter (1944661492953854)
# 
# ⚠️ QUAN TRỌNG:
# - Page ID: Là ID của TRANG FACEBOOK (không phải App ID!)
# - Token: Là Page Access Token (60 days)
# - Đừng commit file .env lên Git!

# Page Access Token (long-lived, 60 days)
# Format: EAAxxxx... (~200 chars)
FACEBOOK_PAGE_ACCESS_TOKEN=EAAGm7bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Page ID (numeric, ~15 digits)
# Ví dụ: 123456789012345
FACEBOOK_PAGE_ID=123456789012345

# Optional: Lưu lại thông tin để tham khảo (không cần dùng trong code)
# FACEBOOK_APP_ID=1944661492953854
# FACEBOOK_APP_NAME=VoAnh CommandCenter
# FACEBOOK_PAGE_NAME=Tên trang của bạn
```

---

### Bước 6: Restart Application

```bash
# Stop app nếu đang chạy
# Ctrl+C

# Start lại
npm start

# Hoặc dev mode
npm run dev
```

---

### Bước 7: Check Logs

Khi app khởi động, bạn sẽ thấy:

```
[Config] Initializing configuration...
[Config] Environment: production
[Config] GitHub: configured
[Config] OpenAI: configured
[Config] Notion: configured
[Config] Facebook: configured ✓        ← PHẢI CÓ DẤU TÍCH NÀY!
[Config] Telegram: configured
...
[Facebook] Initializing Facebook service...
[Facebook] Verifying page access...
[Facebook] Connected to page: [Tên trang của bạn] ✓   ← PHẢI CÓ TÊN TRANG!
[Facebook] Service ready ✓
```

**Nếu thấy error:**
- "Facebook not configured" → Thiếu token hoặc page ID trong .env
- "Token verification failed" → Token hết hạn hoặc không hợp lệ
- "Invalid page ID" → Page ID sai

---

### Bước 8: Test Posting

```bash
# Chạy test script
node test-facebook.js "Hello from CipherH! 🤖"

# Kết quả mong đợi:
Testing Facebook integration...
Posting to Facebook...
✅ Success! Post published
Post ID: 123456789_987654321
View at: https://www.facebook.com/123456789_987654321

# Check trang Facebook → Bài post xuất hiện!
```

---

## ✅ Checklist Hoàn Chỉnh

```
☐ 1. Chọn app: VoAnh CommandCenter (1944661492953854)
☐ 2. Vào Graph API Explorer: https://developers.facebook.com/tools/explorer/
☐ 3. Chọn app trong dropdown
☐ 4. Get User Access Token với permissions: pages_*
☐ 5. Query /me/accounts để xem tất cả pages
☐ 6. Copy Page ID và Page Access Token từ kết quả
☐ 7. Vào Token Debugger: https://developers.facebook.com/tools/debug/accesstoken/
☐ 8. Paste token và click "Extend Access Token"
☐ 9. Copy long-lived token (60 days)
☐ 10. Test token: curl "https://graph.facebook.com/v18.0/PAGE_ID?access_token=TOKEN"
☐ 11. Add vào .env:
     - FACEBOOK_PAGE_ACCESS_TOKEN=...
     - FACEBOOK_PAGE_ID=...
☐ 12. Verify .env trong .gitignore (không commit!)
☐ 13. Restart app: npm start
☐ 14. Check logs: "[Facebook] Connected to page: ..."
☐ 15. Test: node test-facebook.js "Test message"
☐ 16. Check trang Facebook → Bài post xuất hiện!
☐ 17. Set reminder để renew token sau 55 ngày
```

---

## 🎯 Ví Dụ Cụ Thể

### Giả sử bạn có trang: "Ẩm Thực Việt Nam"

**Sau khi query `/me/accounts`:**
```json
{
  "data": [
    {
      "id": "100899234567890",
      "name": "Ẩm Thực Việt Nam",
      "access_token": "EAAGm7bZCQrs0BO8wZC2vXZBH..."
    }
  ]
}
```

**Thì .env của bạn:**
```bash
FACEBOOK_PAGE_ACCESS_TOKEN=EAAGm7bZCQrs0BO8wZC2vXZBH...
FACEBOOK_PAGE_ID=100899234567890
```

**Khi app chạy:**
```
[Facebook] Connected to page: Ẩm Thực Việt Nam ✓
```

**Khi post:**
```
✅ Posted to: Ẩm Thực Việt Nam
📝 Message: "Món ăn ngon hôm nay..."
🔗 https://facebook.com/100899234567890_123456
```

---

## 🔍 Troubleshooting Cụ Thể

### Vấn đề 1: "Không thấy trang của mình trong /me/accounts"

**Nguyên nhân:**
- Bạn chưa phải admin/editor của trang
- Chưa grant permissions `pages_show_list`

**Giải pháp:**
1. Verify bạn là admin: vào Facebook → Settings → Page Roles
2. Re-authorize: Graph Explorer → Get Token → Grant all permissions
3. Retry `/me/accounts`

### Vấn đề 2: "Token verification failed"

**Nguyên nhân:**
- Token hết hạn (chỉ 1-2 giờ nếu chưa extend)
- Token bị revoke

**Giải pháp:**
1. Generate token mới từ Graph Explorer
2. Nhớ extend to 60 days
3. Update .env với token mới

### Vấn đề 3: "Cannot post to page"

**Nguyên nhân:**
- Token thiếu permission `pages_manage_posts`
- Page ID sai

**Giải pháp:**
1. Regenerate token với đầy đủ permissions
2. Verify Page ID: curl check như test 1

### Vấn đề 4: "App ở development mode, không post được"

**Đây KHÔNG phải vấn đề!**
- Development mode vẫn post được
- Chỉ cần bạn là admin/developer của app
- Post sẽ hiện trên page (public có thể thấy)

**Nếu muốn publish app:**
1. Dashboard app → Settings → Basic
2. Toggle "App Mode" từ Development → Live
3. Cần App Review cho một số permissions

---

## 📊 So Sánh 2 Apps Của Bạn

| Feature | "vô" (1280719510550809) | "VoAnh CommandCenter" (1944661492953854) |
|---------|------------------------|------------------------------------------|
| **Tên** | Khó nhớ | Dễ hiểu ✅ |
| **Mode** | Active | Development ✅ |
| **Type** | Business | Business |
| **Doanh nghiệp** | VO ANH | VO ANH |
| **Khuyến nghị** | OK | **Better** ✅ |

**Kết luận:** Dùng **"VoAnh CommandCenter"** cho project này.

---

## 🔒 Security Checklist

```
☐ Token được lưu trong .env (không hard-code)
☐ .env trong .gitignore (không commit)
☐ Token là Page Token (không phải User Token)
☐ Token có hạn 60 ngày (không phải short-lived 1h)
☐ Permissions minimum cần thiết (pages_manage_posts, pages_read_engagement)
☐ Set calendar reminder renew token sau 55 ngày
☐ Không share token trong chat/email
☐ Không post token lên Git/social media
```

---

## 📚 Resources

### Your Apps:
- App 1: https://developers.facebook.com/apps/1280719510550809/
- App 2: https://developers.facebook.com/apps/1944661492953854/ ✅ (Recommended)

### Tools:
- Graph API Explorer: https://developers.facebook.com/tools/explorer/
- Access Token Debugger: https://developers.facebook.com/tools/debug/accesstoken/
- Graph API Reference: https://developers.facebook.com/docs/graph-api/

### Docs:
- `FACEBOOK_KEYS_GUIDE.md` - Hướng dẫn chi tiết keys
- `FACEBOOK_IDS_EXPLAINED.md` - Giải thích App ID vs Page ID
- `FACEBOOK_SETUP.md` - English guide
- `FACEBOOK_VI.md` - Vietnamese quick guide

---

## 🎉 Tóm Tắt Cho Trường Hợp Của Bạn

### Bạn có:
- ✅ App "VoAnh CommandCenter" (ID: 1944661492953854)
- ✅ App "vô" (ID: 1280719510550809)

### Bạn cần làm:
1. 🔍 **Chọn app:** VoAnh CommandCenter (recommended)
2. 🔑 **Get Page Token:** Graph Explorer → `/me/accounts`
3. 📋 **Copy:** Page ID và Page Access Token
4. ⏰ **Extend:** Token to 60 days
5. 💾 **Save:** Vào .env file
6. 🚀 **Test:** npm start → node test-facebook.js

### Kết quả:
- ✅ Bot có thể tự động đăng bài Facebook
- ✅ Bot có thể đọc và reply comments
- ✅ Hoàn toàn tự động, không cần can thiệp

---

**🎯 App ID của bạn = KHÔNG PHẢI Page ID!**
**✅ Dùng `/me/accounts` để tìm Page ID thật!**
**🔑 App: VoAnh CommandCenter (1944661492953854)**
