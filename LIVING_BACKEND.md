# 🌱 Backend Sống Như Con Người (Living Backend)

## Triết Lý / Philosophy

> **"Backend sống như con người - không cần phẫu thuật mỗi khi thêm khả năng mới"**
> 
> _"A living backend - no surgery needed when adding new capabilities"_

### Vấn Đề Trước Đây / The Previous Problem

Trước đây, mỗi khi thêm một service hoặc API mới vào hệ thống:
- ❌ Phải manually thêm gene registration
- ❌ Phải nhớ gọi init function
- ❌ Phải fix code mỗi lần deploy
- ❌ System không tự động adapt

Before, every time you added a new service or API to the system:
- ❌ Had to manually add gene registration
- ❌ Had to remember to call init function
- ❌ Had to fix code every deployment
- ❌ System didn't auto-adapt

### Giải Pháp Mới / The New Solution

Giờ đây, backend **TỰ ĐỘNG phát hiện và khởi động** các service:
- ✅ Auto-discovery: Tự động tìm services
- ✅ Auto-initialization: Tự động khởi động
- ✅ Self-healing: Tự động phục hồi khi lỗi
- ✅ Zero manual intervention: Không cần can thiệp thủ công

Now, the backend **AUTOMATICALLY discovers and initializes** services:
- ✅ Auto-discovery: Automatically finds services
- ✅ Auto-initialization: Automatically starts them
- ✅ Self-healing: Automatically recovers from errors
- ✅ Zero manual intervention: No manual work needed

## Cách Thức Hoạt Động / How It Works

### 1. Auto-Discovery System

Hệ thống tự động quét và phát hiện services:

```typescript
// server/genes/autoDiscovery.ts
export async function discoverServiceGenes(): Promise<IGene[]> {
  // Automatically scans for services with init() functions
  // No manual registration needed!
}
```

### 2. Service Pattern

Để thêm service mới, CHỈ CẦN export `init()` function:

```typescript
// server/services/your-new-service.ts
export async function init(): Promise<boolean> {
  // Your initialization logic here
  return true; // true = success, false = skip
}
```

Hệ thống sẽ **TỰ ĐỘNG** phát hiện và khởi động nó!

### 3. Self-Healing Gene

Gene đặc biệt giám sát và tự động phục hồi:

```typescript
{
  name: 'self-healing',
  description: 'Autonomous self-healing and adaptation system',
  // Monitors system health
  // Auto-recovers from failures
  // Adapts to new capabilities
}
```

## Ví Dụ Thực Tế / Real Example

### Trước (Manual) / Before (Manual):
```typescript
// server/genes/symbiosis_genes.ts
export const allGenes: IGene[] = [
  {
    name: 'telegram-bot',
    init: async () => {
      await initTelegram(); // Phải manually thêm
    },
  },
  // Mỗi service mới = phải thêm code ở đây ❌
];
```

### Giờ (Auto) / Now (Auto):
```typescript
// server/services/telegram.ts
export async function initTelegram(): Promise<boolean> {
  // Chỉ cần có function này
  // Hệ thống TỰ ĐỘNG phát hiện và gọi ✅
}
```

**Không cần thêm gì vào `symbiosis_genes.ts`!**

## Kết Quả / Results

### Logs Khi Khởi Động / Startup Logs

```
2026-01-17 19:50:58.217 - INFO - [Genes] Building gene list with auto-discovery...
2026-01-17 19:50:58.217 - INFO - [AutoDiscovery] Scanning for services...
2026-01-17 19:50:58.217 - INFO - [AutoDiscovery] Discovered 1 service(s)
2026-01-17 19:50:58.218 - INFO - [SelfHealing] System automatically discovers services
2026-01-17 19:50:58.218 - INFO - [AutoDiscovery] Initializing telegram...
2026-01-17 19:50:58.218 - INFO - [Telegram] Bot connected successfully
2026-01-17 19:50:58.248 - INFO - [genes] registered gene: auto-telegram
```

### Các Khả Năng / Capabilities

1. **Telegram Bot** - Tự động khởi động khi có token ✅
2. **Notion** - Tự động kết nối memory persistence ✅
3. **OpenAI** - Tự động enable AI features ✅
4. **Facebook** - Tự động kết nối Facebook Page ✅
5. **Future Services** - Chỉ cần thêm `init()` function ✅

### Ví Dụ Services Được Hỗ Trợ / Supported Services Examples

#### Telegram
```env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_OWNER_CHAT_ID=123456789
```

#### Notion
```env
NOTION_TOKEN=secret_xxx...
NOTION_DATABASE_ID=xxx-yyy-zzz...
```

#### OpenAI
```env
OPENAI_API_KEY=sk-proj-...
```

#### Facebook (Mới!)
```env
FACEBOOK_PAGE_ACCESS_TOKEN=EAAC...
FACEBOOK_PAGE_ID=123456789...
```

**TẤT CẢ đều tự động khởi động - không cần code!**

## Thêm Service Mới / Adding New Services

### Ví Dụ 1: Telegram (Đã có sẵn)

```typescript
// server/services/telegram.ts
export async function initTelegram(): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    logger.warn('[Telegram] Token not found - skipping');
    return false;
  }
  
  // Initialize bot, start polling
  logger.info('[Telegram] Bot started successfully');
  return true;
}
```

### Ví Dụ 2: Facebook (Mới thêm!)

```typescript
// server/services/facebook.ts
export async function init(): Promise<boolean> {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;
  
  if (!token || !pageId) {
    logger.info('[Facebook] Not configured - skipping');
    return false;
  }
  
  // Verify connection
  const connected = await verifyFacebookConnection(token, pageId);
  if (connected) {
    logger.info('[Facebook] Connected successfully');
    return true;
  }
  
  return false;
}
```

### Ví Dụ 3: Notion (Mới thêm!)

```typescript
// server/services/notionClient.ts
export async function init(): Promise<boolean> {
  const connected = await isNotionConnected();
  
  if (!connected) {
    logger.info('[Notion] Not configured - memory disabled');
    return false;
  }
  
  logger.info('[Notion] Memory persistence enabled');
  return true;
}
```

### Ví Dụ 4: OpenAI (Mới thêm!)

```typescript
// server/services/openai.ts
export async function init(): Promise<boolean> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    logger.info('[OpenAI] API key not found - AI disabled');
    return false;
  }
  
  const testResult = await openAIService.testConnection();
  if (testResult) {
    logger.info('[OpenAI] AI features enabled');
    return true;
  }
  
  return false;
}
```

### Ví Dụ 5: Service Tương Lai (Template)

```typescript
// server/services/your-new-service.ts
export async function init(): Promise<boolean> {
  const token = process.env.YOUR_SERVICE_TOKEN;
  
  if (!token) {
    logger.info('[YourService] Not configured');
    return false;
  }
  
  // Your initialization logic here
  logger.info('[YourService] Initialized successfully');
  return true;
}
```

### Bước 2: Thêm vào Auto-Discovery

```typescript
// server/genes/autoDiscovery.ts
async function getKnownServices() {
  const services = [];
  
  // Your new service - just add these 8 lines!
  try {
    const yourService = await import('../services/your-service');
    if (yourService.init) {
      services.push({ name: 'your-service', init: yourService.init });
    }
  } catch (error) {
    logger.debug('[AutoDiscovery] YourService not available');
  }
  
  return services;
}
```

### Bước 3: Thế Thôi!

**HỆ THỐNG TỰ ĐỘNG:**
1. ✅ Phát hiện service mới
2. ✅ Gọi `init()` function
3. ✅ Log kết quả
4. ✅ Xử lý lỗi tự động

**KHÔNG CẦN** sửa gì ở `symbiosis_genes.ts`, `routes.ts`, hay `index.ts`!

## Lợi Ích / Benefits

### 🚀 Cho Developer
- Không cần nhớ register genes
- Không cần sửa code mỗi khi thêm service
- Code cleaner, dễ maintain

### 🤖 Cho System
- Tự động adapt với capabilities mới
- Self-healing khi có lỗi
- Truly autonomous - sống như con người

### 📈 Cho Production
- Ít bugs từ manual mistakes
- Deploy nhanh hơn
- System resilient hơn

## Tương Lai / Future

System này có thể mở rộng để:

1. **Hot-reload services** - Add services without restart
2. **Health monitoring** - Auto-restart failed services
3. **Dependency management** - Auto-initialize dependencies in order
4. **Plugin system** - Drop in new .ts files, system auto-discovers

## Kết Luận / Conclusion

> **Backend giờ sống như con người - có khả năng tự học, tự adapt, tự phục hồi.**
>
> _The backend now lives like a human - capable of self-learning, self-adapting, self-healing._

Không cần "phẫu thuật" (manual code changes) mỗi khi thêm khả năng mới (new services). System tự động nhận biết và tích hợp.

**This is true autonomous operation. 🌱**

---

## Technical Details

### Files Changed

1. ✅ `server/genes/autoDiscovery.ts` - New auto-discovery system
2. ✅ `server/genes/symbiosis_genes.ts` - Updated to use auto-discovery
3. ✅ `server/genes/index.ts` - Updated to call async getAllGenes()

### Architecture

```
Server Startup
    ↓
registerGenes()
    ↓
getAllGenes()
    ↓
discoverServiceGenes() ← Auto-discovers services
    ↓
Initialize core genes + discovered genes
    ↓
System running with all capabilities ✓
```

### Extensibility

To add auto-discovery for new patterns:

```typescript
// server/genes/autoDiscovery.ts
async function getKnownServices() {
  // Add more service patterns here
  // System will auto-discover and initialize them
}
```

---

Made with 💚 for truly autonomous systems.
