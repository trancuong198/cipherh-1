# Facebook IDs - Giải thích sự khác biệt

## ❌ Nhầm lẫn phổ biến: App ID ≠ Page ID

Bạn đang có:
```
App ID: 1944661492953854
```

**ĐÂY LÀ APP ID, KHÔNG PHẢI PAGE ID!**

---

## 🔍 Sự khác biệt

### 1. APP ID (Application ID)
**Là gì:**
- ID của Facebook Application/App
- Được tạo khi bạn tạo app tại https://developers.facebook.com/

**Format:**
```
1944661492953854  ← App ID của bạn
```

**Dùng để làm gì:**
- Xác định app trong Facebook Platform
- Cần khi convert token
- Cần khi call Graph API với app credentials

**Ví dụ:**
```
App Name: VoAnh CommandCenter
App ID: 1944661492953854  ← CÁI NÀY
```

---

### 2. PAGE ID
**Là gì:**
- ID của Facebook Page (Trang Facebook)
- Mỗi trang Facebook có một Page ID riêng

**Format:**
```
123456789012345  ← Example Page ID (thường 15 chữ số)
```

**Dùng để làm gì:**
- Xác định page nào sẽ đăng bài
- Required để post to Facebook Page
- Dùng trong API calls: `/PAGE_ID/feed`

---

## 🎯 Những gì bạn CẦN

### Để đăng bài Facebook, bạn cần:

```bash
# File: .env

# 1. Page Access Token (NOT App token!)
FACEBOOK_PAGE_ACCESS_TOKEN=EAAxxxxx...

# 2. Page ID (NOT App ID!)
FACEBOOK_PAGE_ID=123456789012345  ← TÌM CÁI NÀY!
```

---

## 📋 Cách tìm PAGE ID của bạn

### Phương án 1: Từ Facebook Page URL

1. Vào trang Facebook của bạn
2. Xem URL trên browser:
   ```
   https://www.facebook.com/YOUR_PAGE_NAME
   hoặc
   https://www.facebook.com/profile.php?id=123456789012345
   ```
3. Nếu URL có `?id=`, đó là Page ID!

### Phương án 2: About Section

1. Vào Facebook Page của bạn
2. Click tab **"About"** (Giới thiệu)
3. Scroll xuống, tìm section có ghi **"Page ID"**
4. Copy số đó

### Phương án 3: Graph API Explorer (Chuẩn nhất)

1. Vào: https://developers.facebook.com/tools/explorer/
2. Chọn app của bạn: **VoAnh CommandCenter** (App ID: 1944661492953854)
3. Get User Token hoặc Page Token
4. Trong query field, gõ: `/me/accounts`
5. Click **Submit**
6. Kết quả sẽ hiện:
   ```json
   {
     "data": [
       {
         "id": "123456789012345",  ← ĐÂY LÀ PAGE ID!
         "name": "Tên page của bạn",
         "access_token": "EAAxxxxx..."  ← Đây là Page Access Token!
       }
     ]
   }
   ```

### Phương án 4: API Call

```bash
# Get User Token từ Graph Explorer trước
USER_TOKEN="your_user_token_here"

# Call API
curl "https://graph.facebook.com/v18.0/me/accounts?access_token=$USER_TOKEN"

# Response sẽ có Page ID và Page Access Token
```

---

## 🔧 Setup đúng

### Bước 1: Xác định App và Page

```
✅ App Name: VoAnh CommandCenter
✅ App ID: 1944661492953854

❓ Page Name: [Tên trang của bạn]
❓ Page ID: [CẦN TÌM - xem phương án trên]
```

### Bước 2: Get Page Access Token

1. Vào Graph API Explorer: https://developers.facebook.com/tools/explorer/
2. Chọn app: **VoAnh CommandCenter**
3. Click "Get Token" → "Get Page Access Token"
4. Chọn page của bạn
5. Grant permissions:
   - ✅ pages_show_list
   - ✅ pages_read_engagement
   - ✅ pages_manage_posts
6. Copy token

### Bước 3: Convert to Long-Lived Token

1. Vào: https://developers.facebook.com/tools/debug/accesstoken/
2. Paste token vào
3. Click "Extend Access Token"
4. Copy long-lived token (60 days)

### Bước 4: Add vào .env

```bash
# File: .env

# App ID - Để reference thôi, không cần dùng trong code
# FACEBOOK_APP_ID=1944661492953854

# Page Access Token - CẦN để đăng bài
FACEBOOK_PAGE_ACCESS_TOKEN=EAAGm7bxxxxxxxxx...

# Page ID - CẦN để xác định page
FACEBOOK_PAGE_ID=123456789012345  ← Thay bằng Page ID thật của bạn
```

---

## 🎓 So sánh

| Loại ID | Ví dụ | Dùng trong .env? | Mục đích |
|---------|-------|------------------|----------|
| **App ID** | 1944661492953854 | ❌ No (có thể skip) | Xác định app |
| **Page ID** | 123456789012345 | ✅ **YES** (Required!) | Xác định page để post |
| **Page Token** | EAAxxxx... | ✅ **YES** (Required!) | Auth để post |

---

## ⚠️ Lỗi phổ biến

### Lỗi: Dùng App ID thay cho Page ID

```bash
# ❌ SAI
FACEBOOK_PAGE_ID=1944661492953854  # Đây là App ID!

# ✅ ĐÚNG
FACEBOOK_PAGE_ID=123456789012345   # Đây là Page ID!
```

### Lỗi khi post:

```
Error: (#803) Cannot query users by their username
```

**Nguyên nhân:** Dùng sai ID (App ID thay vì Page ID)

**Giải pháp:** Tìm đúng Page ID theo hướng dẫn trên

---

## ✅ Verify Setup

### Test 1: Check Page ID

```bash
# Replace với token và page ID của bạn
PAGE_ID="your_page_id_here"
TOKEN="your_page_token_here"

curl "https://graph.facebook.com/v18.0/$PAGE_ID?access_token=$TOKEN"

# Nếu đúng, sẽ trả về page info:
{
  "id": "123456789012345",
  "name": "Your Page Name",
  ...
}

# Nếu sai (dùng App ID):
{
  "error": {
    "message": "Unsupported get request...",
    ...
  }
}
```

### Test 2: Try posting

```bash
PAGE_ID="your_page_id_here"
TOKEN="your_page_token_here"

curl -X POST "https://graph.facebook.com/v18.0/$PAGE_ID/feed" \
  -d "message=Test post from CipherH!" \
  -d "access_token=$TOKEN"

# Success:
{
  "id": "123456789_987654321"
}
```

---

## 📚 Tóm tắt

### Bạn đang có:
- ✅ App ID: **1944661492953854**
- ✅ App Name: **VoAnh CommandCenter**

### Bạn còn cần:
- ❓ **Page ID** - Tìm theo 4 phương án trên
- ❓ **Page Access Token** - Get từ Graph API Explorer

### Setup cuối cùng:
```bash
# .env
FACEBOOK_PAGE_ACCESS_TOKEN=EAAxxxxx...  ← Get from Graph Explorer
FACEBOOK_PAGE_ID=123456789012345        ← Find using methods above
```

---

## 🔍 Quick Check

**Để verify bạn có đúng IDs:**

```bash
# App ID - 15-16 digits
1944661492953854  ✅

# Page ID - thường 15 digits
123456789012345   ← Cần tìm cái này!

# Token - bắt đầu bằng EAA
EAAGm7bxxxxxxxxx...  ← Cần get cái này!
```

---

## 💡 Next Steps

1. ✅ App đã có: VoAnh CommandCenter (1944661492953854)
2. 🔍 Tìm Page ID theo phương án 3 (Graph API Explorer) - Dễ nhất!
3. 🔑 Get Page Access Token từ Graph Explorer
4. 🔄 Convert to Long-Lived Token (60 days)
5. 💾 Add vào .env file:
   ```bash
   FACEBOOK_PAGE_ACCESS_TOKEN=EAAxxxxx...
   FACEBOOK_PAGE_ID=123456789012345
   ```
6. 🚀 Restart app: `npm start`
7. ✅ Test: `node test-facebook.js "Hello!"`

---

## 📖 Xem thêm

- `FACEBOOK_KEYS_GUIDE.md` - Hướng dẫn chi tiết get token
- `FACEBOOK_SETUP.md` - English guide
- `FACEBOOK_VI.md` - Quick Vietnamese guide
- Graph API Explorer: https://developers.facebook.com/tools/explorer/
- Access Token Debugger: https://developers.facebook.com/tools/debug/accesstoken/

---

**🎯 TL;DR:**
- App ID **1944661492953854** = **KHÔNG PHẢI** Page ID
- Bạn cần tìm **Page ID** riêng (dùng Graph API Explorer)
- Setup: `FACEBOOK_PAGE_ID` = Page ID, NOT App ID!

**❌ 1944661492953854 ≠ Page ID**
**✅ Tìm Page ID bằng `/me/accounts` trên Graph Explorer!**
