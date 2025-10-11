/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import type { ProviderType } from '../client/config/models';
import { getAnthropicTokens, saveTokens } from './tokenStorage';
import { refreshAccessToken, isTokenExpired, type OAuthTokens } from './oauth';

export interface ProviderConfig {
  baseUrl?: string;
  apiKey: string;
  name: string;
  oauthTokens?: OAuthTokens | null;
}

// Store original API keys on first load to prevent pollution from configureProvider()
const ORIGINAL_ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const ORIGINAL_ZAI_KEY = process.env.ZAI_API_KEY || '';

/**
 * Provider configurations
 * Maps provider types to their API configurations
 * IMPORTANT: Uses ORIGINAL keys stored at module load time, not process.env,
 * because configureProvider() modifies process.env.ANTHROPIC_API_KEY
 */
export async function getProviders(): Promise<Record<ProviderType, ProviderConfig>> {
  // Check for OAuth tokens for Anthropic provider
  const oauthTokens = await getAnthropicTokens();

  return {
    'anthropic': {
      // No baseUrl = uses default Anthropic endpoint (https://api.anthropic.com)
      apiKey: ORIGINAL_ANTHROPIC_KEY,
      name: 'Anthropic',
      oauthTokens,
    },
    'z-ai': {
      baseUrl: 'https://api.z.ai/api/anthropic',
      apiKey: ORIGINAL_ZAI_KEY,
      name: 'Z.AI',
      oauthTokens: null, // Z.AI doesn't support OAuth
    },
  };
}

/**
 * Configure environment for a specific provider
 * Sets ANTHROPIC_BASE_URL and ANTHROPIC_API_KEY env vars
 *
 * IMPORTANT: For Anthropic provider, prioritizes OAuth over API key
 * If OAuth tokens exist, they will be used instead of the API key
 */
export async function configureProvider(provider: ProviderType): Promise<void> {
  const providers = await getProviders();
  const config = providers[provider];

  // IMPORTANT: Clear ALL auth environment variables first
  // This ensures clean state when switching providers
  delete process.env.CLAUDE_CODE_OAUTH_TOKEN;
  delete process.env.ANTHROPIC_AUTH_TOKEN;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_BASE_URL;

  // Check if using OAuth for this provider
  if (provider === 'anthropic' && config.oauthTokens) {
    console.log('🔐 Using OAuth authentication (API key will be ignored)');

    // Check if token needs refresh
    if (isTokenExpired(config.oauthTokens.expiresAt)) {
      console.log('⏳ OAuth token expired, refreshing...');
      try {
        const newTokens = await refreshAccessToken(config.oauthTokens.refreshToken);
        await saveTokens(newTokens);
        config.oauthTokens = newTokens;
        console.log('✅ OAuth token refreshed successfully');
      } catch (error) {
        console.error('❌ Failed to refresh OAuth token:', error);
        console.log('⚠️  Falling back to API key authentication');
        // Fall through to API key authentication
      }
    }

    // For OAuth, use CLAUDE_CODE_OAUTH_TOKEN which the Claude Code CLI uses
    // This is the correct env var for OAuth authentication with the CLI subprocess
    if (config.oauthTokens && !isTokenExpired(config.oauthTokens.expiresAt)) {
      // Use CLAUDE_CODE_OAUTH_TOKEN for OAuth authentication
      // The Claude Code CLI subprocess will use this for Bearer token auth
      process.env.CLAUDE_CODE_OAUTH_TOKEN = config.oauthTokens.accessToken;

      return;
    }
  }

  // Fall back to API key authentication
  if (!config.apiKey) {
    throw new Error(`Missing API key for provider: ${provider}`);
  }

  console.log(`🔑 Using API key authentication for ${config.name}`);

  // Set or clear base URL
  if (config.baseUrl) {
    process.env.ANTHROPIC_BASE_URL = config.baseUrl;
  } else {
    delete process.env.ANTHROPIC_BASE_URL;
  }

  // Z.AI uses Bearer token (ANTHROPIC_AUTH_TOKEN), not x-api-key
  if (provider === 'z-ai') {
    process.env.ANTHROPIC_AUTH_TOKEN = config.apiKey;
    process.env.ANTHROPIC_API_KEY = '';
  } else {
    // Standard Anthropic API uses x-api-key header
    process.env.ANTHROPIC_API_KEY = config.apiKey;
  }
}

/**
 * Get masked API key for logging (shows last 3 chars)
 */
export function getMaskedApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 6) return '***';
  return `${apiKey.slice(0, 3)}...${apiKey.slice(-3)}`;
}
