/**
 * Command Setup - Automatically copies slash commands to session directories
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Setup slash commands for a session by copying template .md files
 * Creates .claude/commands/ directory in session's working directory
 * and populates it with shared + mode-specific commands
 */
export function setupSessionCommands(workingDir: string, mode: string): void {
  const commandsDir = path.join(workingDir, '.claude', 'commands');

  // Create .claude/commands/ directory
  if (!fs.existsSync(commandsDir)) {
    fs.mkdirSync(commandsDir, { recursive: true });
  }

  // Copy shared commands (available in all modes)
  const sharedCommandsDir = path.join(process.cwd(), 'server', 'commands', 'shared');
  if (fs.existsSync(sharedCommandsDir)) {
    const sharedFiles = fs.readdirSync(sharedCommandsDir);
    for (const file of sharedFiles) {
      if (file.endsWith('.md')) {
        const sourcePath = path.join(sharedCommandsDir, file);
        const destPath = path.join(commandsDir, file);
        fs.copyFileSync(sourcePath, destPath);
      }
    }
  }

  // Copy mode-specific commands
  const modeCommandsDir = path.join(process.cwd(), 'server', 'commands', mode);
  if (fs.existsSync(modeCommandsDir)) {
    const modeFiles = fs.readdirSync(modeCommandsDir);
    for (const file of modeFiles) {
      if (file.endsWith('.md')) {
        const sourcePath = path.join(modeCommandsDir, file);
        const destPath = path.join(commandsDir, file);
        fs.copyFileSync(sourcePath, destPath);
      }
    }
  }

  console.log(`📋 Commands setup: ${commandsDir} (mode: ${mode})`);
}

/**
 * Get count of available commands for a session
 */
export function getCommandCount(workingDir: string): number {
  const commandsDir = path.join(workingDir, '.claude', 'commands');

  if (!fs.existsSync(commandsDir)) {
    return 0;
  }

  const files = fs.readdirSync(commandsDir);
  return files.filter(f => f.endsWith('.md')).length;
}
