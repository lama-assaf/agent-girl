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

export interface ProviderConfig {
  baseUrl?: string;
  apiKey: string;
  name: string;
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
export function getProviders(): Record<ProviderType, ProviderConfig> {
  return {
    'anthropic': {
      // No baseUrl = uses default Anthropic endpoint (https://api.anthropic.com)
      apiKey: ORIGINAL_ANTHROPIC_KEY,
      name: 'Anthropic',
    },
    'z-ai': {
      baseUrl: 'https://api.z.ai/api/anthropic',
      apiKey: ORIGINAL_ZAI_KEY,
      name: 'Z.AI',
    },
  };
}

/**
 * Configure environment for a specific provider
 * Sets ANTHROPIC_BASE_URL and ANTHROPIC_API_KEY env vars
 */
export function configureProvider(provider: ProviderType): void {
  const providers = getProviders();
  const config = providers[provider];

  if (!config.apiKey) {
    throw new Error(`Missing API key for provider: ${provider}`);
  }

  // Set or clear base URL
  if (config.baseUrl) {
    process.env.ANTHROPIC_BASE_URL = config.baseUrl;
  } else {
    delete process.env.ANTHROPIC_BASE_URL;
  }

  // Set API key
  process.env.ANTHROPIC_API_KEY = config.apiKey;
}

/**
 * Get masked API key for logging (shows last 3 chars)
 */
export function getMaskedApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 6) return '***';
  return `${apiKey.slice(0, 3)}...${apiKey.slice(-3)}`;
}
