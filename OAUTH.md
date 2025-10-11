# OAuth Authentication for Agent Girl

Agent Girl now supports **Claude Pro/Max subscription authentication** via OAuth 2.0! This allows you to use your Claude subscription instead of API credits, exactly like OpenCode does.

## 🎉 Features

- ✅ **PKCE OAuth 2.0 Flow** - Secure authentication with Claude Pro/Max
- ✅ **Automatic Token Refresh** - Tokens auto-refresh when expired
- ✅ **API Key Protection** - When OAuth is active, your API key is NEVER used (saves money!)
- ✅ **Global Fetch Interceptor** - Transparently replaces `x-api-key` with `Authorization: Bearer` token
- ✅ **Persistent Storage** - Tokens stored securely in `~/.agent-girl/oauth-tokens.json`

## 🚀 Quick Start

### 1. Login with Claude Pro/Max

```bash
bun run login
```

This will:
1. Open your browser to Claude's OAuth authorization page
2. Ask you to paste the authorization code
3. Exchange the code for access and refresh tokens
4. Save tokens securely to `~/.agent-girl/oauth-tokens.json`

### 2. Check Authentication Status

```bash
bun run auth:status
```

Shows whether you're using OAuth or API key authentication.

### 3. Logout

```bash
bun run logout
```

Clears OAuth tokens and falls back to API key authentication.

## 🔧 How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent Girl Server                         │
├─────────────────────────────────────────────────────────────┤
│  1. Global Fetch Interceptor (installed at startup)         │
│     - Intercepts ALL fetch calls                            │
│     - Detects Anthropic API calls                           │
│     - Replaces x-api-key with Bearer token                  │
│                                                              │
│  2. Provider Configuration                                   │
│     - Checks for OAuth tokens FIRST                         │
│     - Auto-refreshes expired tokens                         │
│     - Falls back to API key if no OAuth                     │
│                                                              │
│  3. Claude Agent SDK                                         │
│     - Uses placeholder API key when OAuth is active         │
│     - Fetch interceptor transparently handles auth          │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **User sends message** → Server receives WebSocket message
2. **Provider configuration** → Checks for OAuth tokens
3. **Token validation** → Refreshes if expired (< 5 minutes)
4. **SDK initialization** → Placeholder API key set
5. **API call** → Fetch interceptor intercepts
6. **Header replacement** → `x-api-key` → `Authorization: Bearer {token}`
7. **Response** → Streamed back to client

### Key Files

- **`server/oauth.ts`** - PKCE flow, token exchange, refresh logic
- **`server/tokenStorage.ts`** - Secure token persistence
- **`server/fetchInterceptor.ts`** - Global fetch monkey-patch
- **`server/providers.ts`** - OAuth prioritization logic
- **`cli.ts`** - Login/logout commands

## 🔐 Security

- **PKCE (Proof Key for Code Exchange)** - Protects against authorization code interception
- **Secure Storage** - Tokens stored in user's home directory (`~/.agent-girl/`)
- **Auto-Refresh** - Tokens refresh 5 minutes before expiry
- **API Key Protection** - When OAuth is active, API key is NEVER sent to Anthropic

## ⚙️ OAuth vs API Key Priority

The system follows this priority:

1. **OAuth tokens** (if present and valid) → Uses subscription, $0 cost
2. **API key** (if OAuth not available) → Uses API credits

**IMPORTANT**: When OAuth tokens exist, the system will NEVER use your API key, even if `ANTHROPIC_API_KEY` is set in your environment. This ensures you don't waste API credits.

## 📝 Implementation Details

### OAuth Client Configuration

- **Client ID**: `9d1c250a-e61b-44d9-88ed-5944d1962f5e` (Same as OpenCode)
- **Authorization URL**: `https://claude.ai/oauth/authorize`
- **Token URL**: `https://console.anthropic.com/v1/oauth/token`
- **Scopes**: `org:create_api_key user:profile user:inference`

### Token Format

```json
{
  "type": "oauth",
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresAt": 1730000000000
}
```

### Fetch Interceptor

The global fetch interceptor replaces authentication headers for all Anthropic API calls:

```typescript
// Before (SDK default)
headers: {
  'x-api-key': 'sk-ant-...'
}

// After (OAuth)
headers: {
  'authorization': 'Bearer eyJ...',
  'anthropic-beta': 'oauth-2025-04-20,claude-code-20250219,...'
}
```

## 🐛 Troubleshooting

### "Failed to exchange code for tokens"

- Make sure you copied the full authorization code from the browser
- The code might contain a `#` symbol - that's OK, it will be handled

### "Failed to refresh token"

- Your refresh token might have expired
- Run `bun run logout` and `bun run login` again

### "Missing API key for provider: anthropic"

- You have no OAuth tokens AND no API key set
- Either run `bun run login` or set `ANTHROPIC_API_KEY` in `.env`

## 💡 Benefits

- **No API Costs** - Use your Claude Pro/Max subscription
- **Same Rate Limits** - As your subscription plan
- **Seamless Integration** - No code changes needed in your app
- **Automatic Refresh** - Set it and forget it

## 🔗 References

- Inspired by [OpenCode's implementation](https://github.com/sst/opencode-anthropic-auth)
- Uses the same OAuth client ID as OpenCode
- Compatible with Claude Pro and Claude Max plans
