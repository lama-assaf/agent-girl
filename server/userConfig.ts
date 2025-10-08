/**
 * Agent Girl - User Configuration Management
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface UserConfig {
  name?: string;
  firstName?: string;
  lastName?: string;
}

const CONFIG_DIR = join(process.cwd(), 'data');
const CONFIG_PATH = join(CONFIG_DIR, 'user-config.json');

/**
 * Ensure the data directory exists
 */
function ensureDataDir() {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Load user configuration from disk
 */
export function loadUserConfig(): UserConfig {
  ensureDataDir();

  if (!existsSync(CONFIG_PATH)) {
    return {};
  }

  try {
    const content = readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to load user config:', error);
    return {};
  }
}

/**
 * Save user configuration to disk
 */
export function saveUserConfig(config: UserConfig): void {
  ensureDataDir();

  try {
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save user config:', error);
    throw error;
  }
}

/**
 * Update user configuration
 */
export function updateUserConfig(updates: Partial<UserConfig>): UserConfig {
  const current = loadUserConfig();
  const updated = { ...current, ...updates };
  saveUserConfig(updated);
  return updated;
}

/**
 * Get user's display name (with fallback)
 */
export function getUserDisplayName(config?: UserConfig): string | null {
  const userConfig = config || loadUserConfig();

  if (userConfig.firstName && userConfig.lastName) {
    return `${userConfig.firstName} ${userConfig.lastName}`;
  }

  if (userConfig.name) {
    return userConfig.name;
  }

  return null;
}
