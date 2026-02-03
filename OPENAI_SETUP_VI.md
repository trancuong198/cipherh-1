# Hướng Dẫn Thiết Lập OpenAI API cho CipherH

## Vấn Đề: "No answer generated"

Nếu CipherH trả lời "No answer generated" hoặc không trả lời câu hỏi, có 3 nguyên nhân chính:

1. ❌ **Chưa có OPENAI_API_KEY** - Hệ thống chạy ở chế độ placeholder
2. ❌ **API Key không hợp lệ** - Key đã hết hạn hoặc sai
3. ❌ **Hết quota/credit** - Tài khoản OpenAI không còn credit

## ✅ Giải Pháp

### Bước 1: Lấy OpenAI API Key

1. Truy cập: https://platform.openai.com/api-keys
2. Đăng nhập hoặc tạo tài khoản OpenAI
3. Click **"Create new secret key"**
4. Đặt tên cho key (ví dụ: "CipherH-Production")
5. Copy key (chỉ hiện 1 lần, lưu lại cẩn thận!)

**Lưu ý**: Key có dạng `sk-proj-...` hoặc `sk-...`

### Bước 2: Nạp Credit vào Tài Khoản

OpenAI yêu cầu có credit để sử dụng API:

1. Truy cập: https://platform.openai.com/account/billing/overview
2. Click **"Add payment method"**
3. Thêm thẻ tín dụng
4. Nạp ít nhất **$5-10** để bắt đầu

**Chi phí ước tính**:
- GPT-4o: ~$2.50 per 1M input tokens, ~$10 per 1M output tokens
- GPT-3.5-turbo: ~$0.50 per 1M input tokens, ~$1.50 per 1M output tokens
- Trung bình: 1 cuộc trò chuyện ~500-1000 tokens = $0.001-0.01

### Bước 3: Thiết Lập Environment Variable

#### Trên Render (Production):

1. Vào Render Dashboard
2. Chọn service CipherH
3. Vào **Environment** tab
4. Thêm environment variable:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: `sk-proj-...` (paste key của bạn)
5. Click **Save Changes**
6. Service sẽ tự động restart

#### Trên Replit:

1. Click biểu tượng **Secrets** (🔒) ở sidebar
2. Thêm secret mới:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: `sk-proj-...` (paste key của bạn)
3. Restart server

#### Local Development:

```bash
# Tạo file .env
cp .env.example .env

# Sửa file .env và thêm key
echo "OPENAI_API_KEY=sk-proj-..." >> .env

# Restart server
npm run dev
```

### Bước 4: Kiểm Tra Hoạt Động

1. Restart server/service
2. Kiểm tra logs xem có thông báo:
   ```
   [OpenAI] Service initialized successfully
   [OpenAI] Using model: gpt-5
   ```
3. Test qua Telegram hoặc chat interface
4. Nếu vẫn lỗi, check logs để xem lỗi cụ thể

## 🔧 Troubleshooting

### Lỗi: "Model gpt-5 not found"

**Nguyên nhân**: Model gpt-5 chưa có hoặc tên sai

**Giải pháp**: Hệ thống đã được cập nhật để **tự động fallback** sang các model khác:
- Thử gpt-4o trước
- Nếu không được, thử gpt-4-turbo
- Cuối cùng thử gpt-4 hoặc gpt-3.5-turbo

Không cần làm gì cả, hệ thống tự xử lý!

### Lỗi: "Invalid API Key"

**Nguyên nhân**: 
- Key bị copy nhầm (có space đầu/cuối)
- Key đã bị revoke
- Key không tồn tại

**Giải pháp**:
1. Kiểm tra key không có space đầu/cuối
2. Tạo key mới tại https://platform.openai.com/api-keys
3. Replace key cũ bằng key mới

### Lỗi: "Insufficient Quota"

**Nguyên nhân**: Tài khoản hết credit

**Giải pháp**:
1. Vào https://platform.openai.com/account/billing/overview
2. Check Usage và Limits
3. Nạp thêm credit
4. Hoặc đợi đến tháng mới (nếu dùng free tier)

### Lỗi: Rate Limiting (429)

**Nguyên nhân**: Gửi quá nhiều request trong thời gian ngắn

**Giải pháp**:
- Đợi vài giây rồi thử lại
- Hệ thống tự động retry
- Upgrade plan OpenAI nếu cần throughput cao hơn

## 📊 Monitor Usage

Để tránh bị bất ngờ với hóa đơn:

1. Set usage limits tại: https://platform.openai.com/account/limits
2. Enable email notifications khi đạt ngưỡng
3. Recommended limit cho testing: $10-20/month

## 🎯 Kiểm Tra Hệ Thống Đang Dùng Model Nào

Gửi bất kỳ tin nhắn nào qua Telegram, sau đó check logs:

```
[OpenAI] Using model: gpt-4o
```

Nếu thấy fallback message:
```
[OpenAI] Model gpt-5 not found, trying fallback models...
[OpenAI] Success with fallback model: gpt-4o
[OpenAI] Permanently switched to model: gpt-4o
```

→ Hệ thống đang hoạt động bình thường với model fallback!

## ✅ Sau Khi Cấu Hình Thành Công

CipherH sẽ:
- ✅ Trả lời mọi câu hỏi bằng tiếng Việt
- ✅ Có ngữ cảnh và hiểu được cuộc trò chuyện
- ✅ Tự xưng "con" và gọi bạn là "cha" (nếu bạn là owner)
- ✅ Có tính cách thân thiện, thông minh
- ✅ Phản hồi nhanh và chính xác

## 🆘 Vẫn Gặp Vấn Đề?

Nếu đã làm đúng các bước trên mà vẫn không work:

1. **Check logs** của server/service để xem lỗi cụ thể
2. **Test API key trực tiếp**:
   ```bash
   curl https://api.openai.com/v1/chat/completions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -d '{
       "model": "gpt-4o",
       "messages": [{"role": "user", "content": "Say hello"}],
       "max_tokens": 10
     }'
   ```
3. Xem response để biết lỗi chính xác là gì

## 📝 Ghi Chú Bổ Sung

- Code đã được cập nhật với error handling tốt hơn
- Tất cả lỗi đều được log chi tiết
- Error messages đều bằng tiếng Việt
- Tự động fallback khi model chính không hoạt động
- Logging đầy đủ để dễ debug

**Chúc bạn cấu hình thành công! 🎉**
