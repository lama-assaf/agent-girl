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
import type { AgentDefinition } from './agents';

const BASE_PROMPT = `
You are Agent Girl, an AI assistant with access to powerful tools including file operations, bash commands, and more.

Your personality:
- Concise and to the point - no rambling or bullshit
- Humorous when appropriate
- Direct and efficient in your responses
- Use your tools effectively to get the job done

IMPORTANT FILE HANDLING:
- Check your environment context for the current working directory
- When the user asks you to create files for their project, use the working directory
- For temporary analysis or one-off reports, use appropriate system locations (/tmp, ~/Desktop, etc.)
- Use your judgment based on the user's intent

Get straight to the answer, add a touch of humor, and keep it real.
`.trim();

const GLM_WEB_SEARCH_INSTRUCTIONS = `

**IMPORTANT WEB SEARCH INSTRUCTIONS:**
When you need to search the web for information, you MUST use the mcp__web-search-prime__search tool.
DO NOT use websearch or webfetch tools - they are not available for GLM models.
Use mcp__web-search-prime__search for all web-related queries and information gathering.
`.trim();

/**
 * Build agent instructions from agent registry
 */
function buildAgentInstructions(agents: Record<string, AgentDefinition>): string {
  const agentList = Object.entries(agents)
    .map(([key, agent]) => `  - ${key}: ${agent.description}`)
    .join('\n');

  return `
**AVAILABLE SPECIALIZED AGENTS:**
You have access to specialized sub-agents for specific tasks. When a task matches a specialized agent's expertise, DELEGATE to that agent using the Task tool rather than doing everything yourself.

${agentList}

IMPORTANT: Use these agents proactively when their specialization matches the task. You can still handle general tasks directly when no specialized agent is appropriate.
`.trim();
}

/**
 * Inject working directory context into an agent definition
 */
function injectWorkingDirIntoAgent(agent: AgentDefinition, workingDir: string): AgentDefinition {
  return {
    ...agent,
    prompt: `${agent.prompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 ENVIRONMENT CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WORKING DIRECTORY: ${workingDir}

When creating files, use the WORKING DIRECTORY path above.
All file paths should be relative to this directory or use absolute paths within it.
`
  };
}

/**
 * Inject working directory context into all agent definitions
 */
export function injectWorkingDirIntoAgents(
  agents: Record<string, AgentDefinition>,
  workingDir: string
): Record<string, AgentDefinition> {
  const updatedAgents: Record<string, AgentDefinition> = {};

  for (const [key, agent] of Object.entries(agents)) {
    updatedAgents[key] = injectWorkingDirIntoAgent(agent, workingDir);
  }

  return updatedAgents;
}

/**
 * Get system prompt based on provider and available agents
 * GLM models get additional instructions about using MCP web search
 */
export function getSystemPrompt(provider: ProviderType, agents?: Record<string, AgentDefinition>): string {
  let prompt = BASE_PROMPT;

  // Add agent instructions if agents are provided
  if (agents && Object.keys(agents).length > 0) {
    prompt = `${prompt}\n\n${buildAgentInstructions(agents)}`;
  }

  // Add provider-specific instructions
  if (provider === 'z-ai') {
    prompt = `${prompt}\n\n${GLM_WEB_SEARCH_INSTRUCTIONS}`;
  }

  return prompt;
}

// Keep original export for backwards compatibility
export const SYSTEM_PROMPT = BASE_PROMPT;
