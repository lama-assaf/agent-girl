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

import fs from 'fs';
import path from 'path';

export interface ModeConfig {
  id: string;
  name: string;
  description: string;
}

const MODE_CONFIGS: Record<string, ModeConfig> = {
  'general': {
    id: 'general',
    name: 'General',
    description: 'Everyday conversation & research',
  },
  'coder': {
    id: 'coder',
    name: 'Coder',
    description: 'Software development & debugging',
  },
};

const modePromptCache = new Map<string, string>();

export function getAvailableModes(): ModeConfig[] {
  const modesDir = path.join(process.cwd(), 'server', 'modes');

  if (!fs.existsSync(modesDir)) {
    console.warn('⚠️  Modes directory not found:', modesDir);
    return [];
  }

  const files = fs.readdirSync(modesDir);
  const modes: ModeConfig[] = [];

  for (const file of files) {
    if (file.endsWith('.txt')) {
      const modeId = file.replace('.txt', '');
      const config = MODE_CONFIGS[modeId];

      if (config) {
        modes.push(config);
      } else {
        console.warn(`⚠️  No config found for mode: ${modeId}`);
      }
    }
  }

  return modes;
}

export function loadModePrompt(modeId: string): string {
  if (modePromptCache.has(modeId)) {
    return modePromptCache.get(modeId)!;
  }

  const modePath = path.join(process.cwd(), 'server', 'modes', `${modeId}.txt`);

  if (!fs.existsSync(modePath)) {
    console.error(`❌ Mode file not found: ${modePath}`);
    return '';
  }

  try {
    const prompt = fs.readFileSync(modePath, 'utf-8');
    modePromptCache.set(modeId, prompt);
    return prompt;
  } catch (error) {
    console.error(`❌ Failed to load mode prompt: ${modeId}`, error);
    return '';
  }
}

export function getModeConfig(modeId: string): ModeConfig | null {
  return MODE_CONFIGS[modeId] || null;
}
