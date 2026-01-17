# CipherH - Hướng dẫn Deploy lên Render

## Tổng quan
Dự án này đã được cấu hình sẵn để deploy lên Render.com thông qua file `render.yaml`.

## Các bước deploy

### 1. Chuẩn bị Repository
- Đảm bảo code đã được push lên GitHub
- File `render.yaml` đã có sẵn trong repository

### 2. Kết nối với Render
1. Đăng nhập vào https://render.com
2. Click "New +" và chọn "Blueprint"
3. Kết nối với GitHub repository: `trancuong198/cipherh-1`
4. Render sẽ tự động phát hiện file `render.yaml`

### 3. Cấu hình Environment Variables (Tùy chọn)
Các biến môi trường sau là **tùy chọn**. Ứng dụng sẽ chạy ở chế độ placeholder nếu không có:

#### Bắt buộc cho Production:
- `SESSION_SECRET`: Chuỗi ngẫu nhiên để mã hóa session (khuyên dùng)

#### Tùy chọn (cho đầy đủ tính năng):
- `OPENAI_API_KEY`: API key từ OpenAI (cho AI features)
  - Lấy tại: https://platform.openai.com/api-keys
- `NOTION_TOKEN`: Token từ Notion integration (cho memory persistence)
  - Tạo tại: https://www.notion.so/my-integrations
- `TELEGRAM_BOT_TOKEN`: Token bot Telegram (cho notifications)
  - Tạo qua @BotFather trên Telegram
- `TELEGRAM_OWNER_CHAT_ID`: Chat ID của owner
- `GITHUB_TOKEN`: Personal access token (cho auto-sync GitHub)

### 4. Deploy
1. Click "Apply" để bắt đầu deploy
2. Render sẽ:
   - Chạy `npm ci` để cài dependencies
   - Chạy `npm run build` để build project
   - Chạy `npm start` để khởi động server
3. Chờ deploy hoàn tất (thường 2-5 phút)

## Kiểm tra sau khi deploy

### Health Check Endpoints
- `GET /api/health` - Kiểm tra trạng thái hệ thống
- `GET /api/health/symbiosis` - Kiểm tra survival score

### Logs
Xem logs trên Render dashboard để theo dõi:
```
[express] Serving on port 10000
[daemon] CipherH Daemon auto-started - 24/7 autonomous operation active
[reporting] SelfReporting auto-started - API key monitoring active
```

## Troubleshooting

### Build failed
- Kiểm tra Node.js version (cần Node 20)
- Đảm bảo `package-lock.json` đã được commit
- Xem build logs trên Render dashboard

### Start failed
- Kiểm tra PORT environment variable (mặc định: 10000)
- Xem application logs để tìm lỗi
- Đảm bảo file `dist/index.cjs` đã được build

### Application chạy nhưng không có tính năng AI
- Đây là behavior bình thường nếu không có API keys
- Thêm `OPENAI_API_KEY` và `NOTION_TOKEN` vào environment variables

## Chế độ Placeholder Mode
Khi không có API keys, ứng dụng sẽ chạy ở chế độ placeholder:
- ✅ Web server hoạt động bình thường
- ✅ Health endpoints hoạt động
- ✅ Daemon và reporting loops chạy
- ⚠️ AI features sử dụng mock data
- ⚠️ Memory persistence lưu local (mất khi redeploy)

## Cấu hình nâng cao

### Tùy chỉnh PORT
Render tự động set PORT=10000. Nếu cần thay đổi:
```yaml
envVars:
  - key: PORT
    value: YOUR_PORT
```

### Tăng resources (cần upgrade plan)
Free tier của Render có giới hạn:
- 512 MB RAM
- 0.1 CPU
- Auto-sleep sau 15 phút không hoạt động

Để tránh auto-sleep, cần upgrade lên paid plan hoặc setup external ping service.

## Support
Nếu gặp vấn đề khi deploy:
1. Kiểm tra Render logs
2. Kiểm tra build logs
3. Kiểm tra application logs
4. Tạo issue trên GitHub repository
