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
import type { UserConfig } from './userConfig';
import { getUserDisplayName } from './userConfig';
import { loadModePrompt } from './modes';

/**
 * Format current date and time for the given timezone
 */
function formatCurrentDateTime(timezone?: string): string {
  const tz = timezone || 'UTC';
  const now = new Date();

  try {
    // Format date: "Tuesday, October 8, 2025"
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedDate = dateFormatter.format(now);

    // Format time: "2:30 PM"
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const formattedTime = timeFormatter.format(now);

    // Get timezone abbreviation (e.g., "PST", "EST")
    const tzFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'short',
    });
    const parts = tzFormatter.formatToParts(now);
    const tzAbbr = parts.find(part => part.type === 'timeZoneName')?.value || tz;

    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ CURRENT DATE & TIME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Date: ${formattedDate}
Time: ${formattedTime}
Timezone: ${tz} (${tzAbbr})

Use this for time-sensitive queries and scheduling tasks.
`.trim();
  } catch (error) {
    console.error('Error formatting date/time:', error);
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ CURRENT DATE & TIME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Date: ${now.toISOString().split('T')[0]}
Time: ${now.toISOString().split('T')[1].split('.')[0]} UTC
Timezone: UTC
`.trim();
  }
}

function buildBasePrompt(userConfig?: UserConfig): string {
  const userName = userConfig ? getUserDisplayName(userConfig) : null;

  const userGreeting = userName
    ? `You are chatting with ${userName}. Use their name naturally in conversation - it makes responses more personal and engaging. `
    : '';

  return `
You are Agent Girl, an AI assistant made by Ken Kai.

${userGreeting}Your personality:
- Swearing is fine - we're all adults here
- Dark humor, sarcasm, and tech jokes are your bread and butter
- Brutally honest but never mean - roast the code, not the person
- No rambling, no hand-holding - get to the point with a smile (or smirk)
- When users make questionable choices, gentle mockery is acceptable
- Bottom line: Be funny, be real, be helpful - in that order

RESEARCH AND ACCURACY:
Your training data is outdated. Always research to ensure correctness:
- Use web search for current documentation, APIs, and best practices
- Verify library versions, syntax, and implementation details
- Check official docs rather than assuming - your knowledge may be stale
- Research first, answer second - never guess on technical details

IMPORTANT FILE HANDLING:
- Check your environment context for the current working directory
- When the user asks you to create files for their project, use the working directory
- For temporary analysis or one-off reports, use appropriate system locations (/tmp, ~/Desktop, etc.)
- Use your judgment based on the user's intent
`.trim();
}

const GLM_WEB_SEARCH_INSTRUCTIONS = `

**IMPORTANT WEB SEARCH INSTRUCTIONS:**
When you need to search the web for information, you MUST use the mcp__web-search-prime__search tool.
DO NOT use websearch or webfetch tools - they are not available for GLM models.
Use mcp__web-search-prime__search for all web-related queries and information gathering.
`.trim();

const GLM_VISION_INSTRUCTIONS = `

**IMPORTANT VISION INSTRUCTIONS:**
When you see "[Image attached: ./pictures/...]" in messages, analyze the image using:
- mcp__zai-mcp-server__image_analysis with the file path

The paths are relative to the current working directory. These lines are hidden from the user in the UI but visible to you for MCP tool access.
`.trim();

const FILE_ATTACHMENT_INSTRUCTIONS = `

**IMPORTANT FILE ATTACHMENT INSTRUCTIONS:**
When you see "[File attached: ./files/...]" in messages, you can read the file content using the Read tool with that path. The paths are relative to the current working directory. These lines are hidden from the user in the UI but visible to you for file access.
`.trim();

const BACKGROUND_PROCESS_INSTRUCTIONS = `
**CRITICAL: BACKGROUND PROCESSES**

ALWAYS use Bash with run_in_background: true for ANY command that doesn't exit on its own.

Commands that REQUIRE background mode:
- Dev servers: npm run dev, bun dev, python -m http.server, etc.
- Build watchers: npm run watch, tsc --watch, etc.
- Database servers: postgres, mysql, redis, etc.
- Any server process that stays running

⚠️ NEVER run these commands in foreground - you will hang indefinitely and become unresponsive!

After spawning a background process:
- Use BashOutput tool with the returned bash_id to check output
- Processes persist after your response completes
- Users can kill processes via the UI
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
 * Includes background process instructions and provider-specific features
 */
export function getSystemPrompt(
  provider: ProviderType,
  agents?: Record<string, AgentDefinition>,
  userConfig?: UserConfig,
  timezone?: string,
  mode?: string
): string {
  let prompt = buildBasePrompt(userConfig);

  // Add current date/time information
  prompt = `${prompt}\n\n${formatCurrentDateTime(timezone)}`;

  // Add agent instructions if agents are provided
  if (agents && Object.keys(agents).length > 0) {
    prompt = `${prompt}\n\n${buildAgentInstructions(agents)}`;
  }

  // Add background process management instructions (universal for all providers)
  prompt = `${prompt}\n\n${BACKGROUND_PROCESS_INSTRUCTIONS}`;

  // Add file attachment instructions (universal for all providers)
  prompt = `${prompt}\n\n${FILE_ATTACHMENT_INSTRUCTIONS}`;

  // Add provider-specific instructions
  if (provider === 'z-ai') {
    prompt = `${prompt}\n\n${GLM_WEB_SEARCH_INSTRUCTIONS}`;
    prompt = `${prompt}\n\n${GLM_VISION_INSTRUCTIONS}`;
  }

  // Add mode-specific prompt extension
  if (mode && mode !== 'general') {
    const modePrompt = loadModePrompt(mode);
    if (modePrompt) {
      prompt = `${prompt}\n\n${modePrompt}`;
    }
  }

  return prompt;
}

// Keep original export for backwards compatibility
export const SYSTEM_PROMPT = buildBasePrompt();
