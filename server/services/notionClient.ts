// Notion Client - supports both Replit Integration and traditional token
// Auto-handles authentication for both deployment modes

import { Client } from '@notionhq/client';

let connectionSettings: any;

// Method 1: Replit Integration (for Replit deployment)
async function getReplitAccessToken(): Promise<string | null> {
  try {
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    if (!hostname) return null;

    const xReplitToken = process.env.REPL_IDENTITY 
      ? 'repl ' + process.env.REPL_IDENTITY 
      : process.env.WEB_REPL_RENEWAL 
      ? 'depl ' + process.env.WEB_REPL_RENEWAL 
      : null;

    if (!xReplitToken) return null;

    if (connectionSettings && connectionSettings.settings?.expires_at && 
        new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
      return connectionSettings.settings.access_token;
    }

    connectionSettings = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=notion',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    ).then(res => res.json()).then(data => data.items?.[0]);

    const accessToken = connectionSettings?.settings?.access_token || 
                        connectionSettings?.settings?.oauth?.credentials?.access_token;

    return accessToken || null;
  } catch {
    return null;
  }
}

// Method 2: Traditional token (for Render deployment)
function getTraditionalToken(): string | null {
  return process.env.NOTION_TOKEN || null;
}

// Get Notion client - tries Replit first, falls back to traditional token
export async function getUncachableNotionClient(): Promise<Client> {
  // Try Replit Integration first
  const replitToken = await getReplitAccessToken();
  if (replitToken) {
    console.log("Using Replit Notion Integration");
    return new Client({ auth: replitToken });
  }

  // Fall back to traditional token (for Render/other deployments)
  const traditionalToken = getTraditionalToken();
  if (traditionalToken) {
    console.log("Using traditional Notion token");
    return new Client({ auth: traditionalToken });
  }

  throw new Error('Notion not connected - no token available');
}

// Check if Notion integration is available
export async function isNotionConnected(): Promise<boolean> {
  try {
    const replitToken = await getReplitAccessToken();
    if (replitToken) return true;

    const traditionalToken = getTraditionalToken();
    if (traditionalToken) return true;

    return false;
  } catch {
    return false;
  }
}

// Get connection method for status display
export async function getConnectionMethod(): Promise<string> {
  const replitToken = await getReplitAccessToken();
  if (replitToken) return "replit";

  const traditionalToken = getTraditionalToken();
  if (traditionalToken) return "traditional";

  return "none";
}
