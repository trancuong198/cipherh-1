# Hướng Dẫn Tích Hợp Facebook

## Tại sao backend chưa đăng được bài lên Facebook?

Backend của bạn đã có sẵn code để đăng Facebook, nhưng **chưa được kết nối với hệ thống action**. Bây giờ đã được sửa! ✅

## Những gì đã được thêm vào:

1. ✅ **Action type mới**: `facebook_post` - cho phép hệ thống đăng bài
2. ✅ **Kết nối với ActionsEngine** - tích hợp với hệ thống action tự động
3. ✅ **Test script** - để kiểm tra kết nối Facebook
4. ✅ **Tài liệu chi tiết** - hướng dẫn setup đầy đủ

## Cách Setup (3 bước đơn giản):

### Bước 1: Lấy Facebook Page Access Token

1. Vào [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Chọn app của bạn (hoặc tạo mới tại [Facebook Developers](https://developers.facebook.com/))
3. Click "Get Token" → "Get Page Access Token"
4. Chọn Facebook Page của bạn
5. Cấp quyền: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`
6. Copy **Page Access Token**

### Bước 2: Convert sang Long-Lived Token (60 ngày)

Token ngắn hạn chỉ sống 1 giờ. Chuyển sang dài hạn:

```bash
curl "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=SHORT_TOKEN"
```

### Bước 3: Thêm vào Environment Variables

Thêm vào file `.env` hoặc Replit Secrets:

```bash
FACEBOOK_PAGE_ACCESS_TOKEN=token_của_bạn_ở_đây
FACEBOOK_PAGE_ID=id_page_của_bạn
```

Sau đó **restart** backend:

```bash
npm start
```

## Kiểm tra kết nối:

Chạy test script:

```bash
node test-facebook.js "Chào từ CipherH! 🤖"
```

Nếu thành công, bạn sẽ thấy:
```
✅ Success! Post published
Post ID: 123456789_987654321
```

## Đăng bài từ code:

```javascript
import { actionsEngine } from './server/core/actionsEngine';

const action = {
  type: 'facebook_post',
  description: 'Đăng update hàng ngày',
  parameters: {
    message: 'Hệ thống đang hoạt động tốt! 💪',
    link: 'https://website-cua-ban.com' // tùy chọn
  },
  costEstimate: 0,
  justification: 'Chia sẻ tiến độ với audience'
};

const result = await actionsEngine.execute(action);
console.log(result);
```

## Hệ thống tự động đăng bài:

Sau khi setup, hệ thống sẽ:
- ✅ Tự nhận diện cơ hội để đăng Facebook
- ✅ Tạo nội dung phù hợp
- ✅ Xin phép (nếu cần, tùy autonomy level)
- ✅ Đăng bài
- ✅ Học từ kết quả (likes, comments)

## Khắc phục sự cố:

### "Facebook not configured"
- Kiểm tra đã set cả 2 biến: `FACEBOOK_PAGE_ACCESS_TOKEN` và `FACEBOOK_PAGE_ID`
- Restart backend sau khi thêm

### "Token verification failed"
- Token có thể đã hết hạn (60 ngày)
- Tạo token mới theo Bước 1-2

### "Invalid OAuth access token"
- Đảm bảo dùng **Page Access Token**, không phải User Token
- Token phải có đúng permissions

## Xem thêm:

- Tài liệu tiếng Anh chi tiết: `FACEBOOK_SETUP.md`
- Test script: `test-facebook.js`
- Code Facebook service: `server/services/facebook.ts`
- Code action engine: `server/core/actionsEngine.ts`

## Tóm tắt:

**Trước đây**: Facebook service tồn tại nhưng không được kết nối với action system → không thể đăng bài tự động

**Bây giờ**: ✅ Đã tích hợp hoàn chỉnh! Chỉ cần set token và page ID là hệ thống có thể đăng bài Facebook!

---

Nếu bạn cần giúp thêm về việc lấy token hoặc setup, hãy hỏi nhé! 😊
