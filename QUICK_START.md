# 🚀 Quick Deploy Guide - CipherH

## Tóm Tắt Nhanh

Dự án này **ĐÃ SẴN SÀNG** để deploy lên Render.com!

### ✅ Đã Kiểm Tra
- Build thành công
- Server khởi động ổn định  
- Tất cả endpoints hoạt động
- Core systems chạy đúng

### 🎯 Deploy Ngay

**Bước 1:** Vào https://render.com

**Bước 2:** Click "New +" → "Blueprint"

**Bước 3:** Chọn repo này: `trancuong198/cipherh-1`

**Bước 4:** Click "Apply"

Xong! Render sẽ tự động:
- Cài dependencies với `npm ci`
- Build với `npm run build`  
- Start với `npm start`

### 📝 Environment Variables (Tùy Chọn)

Ứng dụng chạy tốt mà **KHÔNG CẦN** API keys (chế độ placeholder).

Nếu muốn full features, thêm sau:
- `OPENAI_API_KEY` - Cho AI features
- `NOTION_TOKEN` - Cho memory persistence
- `TELEGRAM_BOT_TOKEN` - Cho notifications
- `SESSION_SECRET` - Cho production security

### 🧪 Test Local

```bash
# Test deployment readiness
./test-deployment.sh

# Hoặc manual
npm ci
npm run build
npm start
```

### 📚 Chi Tiết

Xem thêm trong:
- **DEPLOYMENT.md** - Hướng dẫn chi tiết deploy
- **test-deployment.sh** - Script test tự động

### ❓ Gặp Vấn Đề?

1. Kiểm tra logs trên Render dashboard
2. Chạy `./test-deployment.sh` local để debug
3. Xem DEPLOYMENT.md phần Troubleshooting

---

**Lưu ý:** Port trên Render là 10000 (được set tự động qua PORT env var)
