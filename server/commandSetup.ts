/**
 * Command Setup - Automatically copies slash commands to session directories
 */

import * as fs from 'fs';
import * as path from 'path';
import { getBinaryDir } from './startup';

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

  // Get the app's base directory (works in both dev and release)
  const baseDir = getBinaryDir();

  console.log(`🔍 Command setup diagnostics:`);
  console.log(`  - App root (baseDir): ${baseDir}`);
  console.log(`  - Session working dir: ${workingDir}`);
  console.log(`  - Commands dest: ${commandsDir}`);
  console.log(`  - Mode: ${mode}`);

  let copiedCount = 0;

  // Copy shared commands (available in all modes)
  const sharedCommandsDir = path.join(baseDir, 'server', 'commands', 'shared');
  console.log(`  - Shared source: ${sharedCommandsDir} (exists: ${fs.existsSync(sharedCommandsDir)})`);

  if (fs.existsSync(sharedCommandsDir)) {
    const sharedFiles = fs.readdirSync(sharedCommandsDir);
    console.log(`  - Shared files found: ${sharedFiles.join(', ')}`);
    for (const file of sharedFiles) {
      if (file.endsWith('.md')) {
        const sourcePath = path.join(sharedCommandsDir, file);
        const destPath = path.join(commandsDir, file);
        fs.copyFileSync(sourcePath, destPath);
        copiedCount++;
        console.log(`    ✓ Copied: ${file}`);
      }
    }
  } else {
    console.warn(`⚠️  Shared commands directory not found: ${sharedCommandsDir}`);
  }

  // Copy mode-specific commands
  const modeCommandsDir = path.join(baseDir, 'server', 'commands', mode);
  console.log(`  - Mode source: ${modeCommandsDir} (exists: ${fs.existsSync(modeCommandsDir)})`);

  if (fs.existsSync(modeCommandsDir)) {
    const modeFiles = fs.readdirSync(modeCommandsDir);
    console.log(`  - Mode files found: ${modeFiles.join(', ')}`);
    for (const file of modeFiles) {
      if (file.endsWith('.md')) {
        const sourcePath = path.join(modeCommandsDir, file);
        const destPath = path.join(commandsDir, file);
        fs.copyFileSync(sourcePath, destPath);
        copiedCount++;
        console.log(`    ✓ Copied: ${file}`);
      }
    }
  } else {
    console.warn(`⚠️  Mode commands directory not found: ${modeCommandsDir}`);
  }

  console.log(`📋 Commands setup complete: ${copiedCount} files copied to ${commandsDir}`);
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
