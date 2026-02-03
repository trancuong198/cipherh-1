# Facebook Integration Guide

## Setup Instructions

### 1. Get Facebook Page Access Token

To post to Facebook, you need a **long-lived Page Access Token**:

1. Go to [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app (or create one at [Facebook Developers](https://developers.facebook.com/))
3. Click "Get Token" → "Get Page Access Token"
4. Select your Facebook Page
5. Grant permissions: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`
6. Copy the **Page Access Token** (short-lived)

### 2. Convert to Long-Lived Token

Short-lived tokens expire in 1 hour. Convert to long-lived (60 days):

```bash
curl -i -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=SHORT_LIVED_TOKEN"
```

Or use the [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/) to extend the token.

### 3. Get Your Page ID

Visit your Facebook Page and check the URL:
- Format: `https://www.facebook.com/YOUR_PAGE_NAME`
- Or use Graph API Explorer: GET `/me/accounts` to list your pages

### 4. Configure Environment Variables

Add to your `.env` file or Replit Secrets:

```bash
FACEBOOK_PAGE_ACCESS_TOKEN=your_long_lived_page_access_token
FACEBOOK_PAGE_ID=your_facebook_page_id
```

### 5. Restart the Application

After setting the environment variables, restart the backend:

```bash
npm start
```

You should see in the logs:
```
[Facebook] Connected to page: Your Page Name
[Facebook] Service initialized successfully ✓
```

## Testing

### Manual Test

Run the test script to verify the integration:

```bash
node test-facebook.js "Hello from CipherH! 🤖"
```

### Using the Action Engine

You can now trigger Facebook posts through the action system:

```javascript
import { actionsEngine } from './server/core/actionsEngine';

const action = {
  type: 'facebook_post',
  description: 'Post daily update to Facebook',
  parameters: {
    message: 'Daily update: System is running smoothly!',
    link: 'https://your-website.com' // optional
  },
  costEstimate: 0,
  justification: 'Share progress with audience'
};

const result = await actionsEngine.execute(action);
console.log(result);
```

## Autonomous Posting

The system can now autonomously post to Facebook when appropriate. The proposal-to-action engine will:

1. Detect opportunities for Facebook posts
2. Generate appropriate content
3. Request approval (based on autonomy level)
4. Execute the post
5. Learn from the results

## Troubleshooting

### "Facebook not configured"

- Check that both `FACEBOOK_PAGE_ACCESS_TOKEN` and `FACEBOOK_PAGE_ID` are set
- Verify there are no extra spaces or newlines in the values
- Restart the application after setting variables

### "Token verification failed"

- Your token may have expired (Page Access Tokens expire after 60 days)
- Generate a new long-lived token
- Check that the token has the required permissions

### "Invalid OAuth access token"

- The token format is incorrect
- Make sure you're using a **Page Access Token**, not a User Access Token
- Verify the token is for the correct app and page

### "Insufficient permissions"

Your token needs these permissions:
- `pages_show_list` - to verify page access
- `pages_read_engagement` - to read page data
- `pages_manage_posts` - to publish posts

Regenerate the token with all required permissions.

## API Reference

### postToPage(message, link?)

Posts a message to your Facebook Page.

**Parameters:**
- `message` (string, required) - The text content of the post
- `link` (string, optional) - URL to include in the post

**Returns:**
```typescript
{
  success: boolean;
  id?: string;  // Facebook post ID
  error?: {
    message: string;
    type: string;
    code: number;
  }
}
```

### getRecentPosts(limit?)

Get recent posts from your page.

**Parameters:**
- `limit` (number, optional, default: 10) - Number of posts to retrieve

**Returns:** Array of post objects with likes and comments

### replyToComment(commentId, message)

Reply to a comment on your page.

**Parameters:**
- `commentId` (string, required) - The Facebook comment ID
- `message` (string, required) - Your reply text

**Returns:** boolean (success/failure)

## Security Notes

⚠️ **Important:**
- Never commit tokens to version control
- Use environment variables or secrets management
- Rotate tokens regularly (every 60 days)
- Use long-lived tokens for production
- Monitor token usage in Facebook Analytics
- Set up token expiration alerts

## Rate Limits

Facebook Graph API has rate limits:
- 200 calls per hour per user
- 4800 calls per day per app

The system respects these limits and includes error handling.

## Next Steps

Once Facebook is configured, the system will:
- ✅ Auto-initialize on startup
- ✅ Verify token and connection
- ✅ Enable Facebook posting actions
- ✅ Allow autonomous posting (with appropriate governance)
- ✅ Learn from post engagement (likes, comments)

Check the logs for Facebook-related messages to confirm everything is working.
