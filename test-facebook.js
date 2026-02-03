#!/usr/bin/env node
/**
 * Test Facebook Integration
 * 
 * Usage:
 *   node test-facebook.js "Your message here"
 * 
 * Environment variables needed:
 *   FACEBOOK_PAGE_ACCESS_TOKEN=your_token
 *   FACEBOOK_PAGE_ID=your_page_id
 */

async function testFacebookPost() {
  const message = process.argv[2] || 'Test post from CipherH backend';
  
  console.log('Testing Facebook integration...');
  console.log('Message:', message);
  console.log('');
  
  // Check environment variables
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;
  
  if (!token || !pageId) {
    console.error('❌ Error: Facebook credentials not configured');
    console.error('');
    console.error('Please set the following environment variables:');
    console.error('  FACEBOOK_PAGE_ACCESS_TOKEN=your_long_lived_page_token');
    console.error('  FACEBOOK_PAGE_ID=your_page_id');
    console.error('');
    console.error('Or run with credentials:');
    console.error('  FACEBOOK_PAGE_ACCESS_TOKEN=xxx FACEBOOK_PAGE_ID=yyy node test-facebook.js "message"');
    process.exit(1);
  }
  
  console.log('✓ Token found:', token.substring(0, 20) + '...');
  console.log('✓ Page ID:', pageId);
  console.log('');
  
  // Import the Facebook service
  const { postToPage, init } = await import('./dist/services/facebook.js');
  
  // Test initialization
  console.log('Testing Facebook connection...');
  const initResult = await init();
  
  if (!initResult) {
    console.error('❌ Facebook initialization failed');
    console.error('Please check your token and page ID are correct');
    process.exit(1);
  }
  
  console.log('✓ Facebook connected successfully');
  console.log('');
  
  // Test posting
  console.log('Posting to Facebook...');
  const result = await postToPage(message);
  
  if (result.success && result.id) {
    console.log('✅ Success! Post published');
    console.log('Post ID:', result.id);
    console.log('View at: https://www.facebook.com/' + result.id);
  } else {
    console.error('❌ Post failed');
    if (result.error) {
      console.error('Error:', result.error.message);
      console.error('Type:', result.error.type);
      console.error('Code:', result.error.code);
    }
    process.exit(1);
  }
}

testFacebookPost().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});
