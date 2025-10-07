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

interface McpHttpServerConfig {
  type: 'http';
  url: string;
  headers?: Record<string, string>;
}

interface McpStdioServerConfig {
  type: 'stdio';
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

type McpServerConfig = McpHttpServerConfig | McpStdioServerConfig;

/**
 * MCP servers configuration for different providers
 * GLM models have access to Z.AI-specific MCP servers
 * Claude models don't use any MCP servers (use built-in tools instead)
 */
export const MCP_SERVERS_BY_PROVIDER: Record<ProviderType, Record<string, McpServerConfig>> = {
  'anthropic': {
    // Claude models don't use MCP servers - they use built-in tools
  },
  'z-ai': {
    // GLM models use Z.AI MCP servers
    'web-search-prime': {
      type: 'http',
      url: 'https://api.z.ai/api/mcp/web_search_prime/mcp',
      headers: {
        'Authorization': `Bearer ${process.env.ZAI_API_KEY || ''}`,
      },
    },
  },
};

/**
 * Get MCP servers for a specific provider
 */
export function getMcpServers(provider: ProviderType): Record<string, McpServerConfig> {
  return MCP_SERVERS_BY_PROVIDER[provider] || {};
}

/**
 * Get allowed tools for a provider's MCP servers
 */
export function getAllowedMcpTools(provider: ProviderType): string[] {
  if (provider === 'z-ai') {
    return [
      'mcp__web-search-prime__search',
    ];
  }
  return [];
}
