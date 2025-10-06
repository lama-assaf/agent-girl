import os from 'os';
import path from 'path';
import fs from 'fs';

/**
 * Get the default working directory for agent operations
 * Cross-platform: ~/Documents/agent-girl (Mac/Linux) or C:\Users\{user}\Documents\agent-girl (Windows)
 */
export function getDefaultWorkingDirectory(): string {
  const homeDir = os.homedir();
  const defaultDir = path.join(homeDir, 'Documents', 'agent-girl');

  console.log('🏠 Platform:', os.platform());
  console.log('🏠 Home directory:', homeDir);
  console.log('🏠 Default working directory:', defaultDir);

  return defaultDir;
}

/**
 * Expand tilde (~) in path to actual home directory
 * Works cross-platform
 */
export function expandPath(dirPath: string): string {
  if (!dirPath) return dirPath;

  // If path starts with ~, replace with home directory
  if (dirPath.startsWith('~/') || dirPath === '~') {
    const homeDir = os.homedir();
    const expanded = dirPath === '~'
      ? homeDir
      : path.join(homeDir, dirPath.slice(2));

    console.log('🔄 Path expansion:', {
      original: dirPath,
      expanded: expanded
    });

    return expanded;
  }

  // Return absolute path as-is
  return path.resolve(dirPath);
}

/**
 * Validate that a directory exists and is accessible
 */
export function validateDirectory(dirPath: string): { valid: boolean; error?: string; expanded?: string } {
  try {
    // Expand path first
    const expanded = expandPath(dirPath);

    // Check if path exists
    if (!fs.existsSync(expanded)) {
      console.warn('⚠️  Directory does not exist:', expanded);
      return {
        valid: false,
        error: 'Directory does not exist',
        expanded
      };
    }

    // Check if it's actually a directory (follows symlinks)
    const stats = fs.statSync(expanded);
    if (!stats.isDirectory()) {
      console.warn('⚠️  Path is not a directory:', expanded);
      return {
        valid: false,
        error: 'Path is not a directory',
        expanded
      };
    }

    // Check if it's a symbolic link (log warning but allow)
    const lstat = fs.lstatSync(expanded);
    if (lstat.isSymbolicLink()) {
      console.warn('⚠️  Path is a symbolic link:', expanded);
      console.log('🔗 Symlink target:', fs.realpathSync(expanded));
    }

    // Check read/write permissions by attempting to access
    try {
      fs.accessSync(expanded, fs.constants.R_OK | fs.constants.W_OK);
    } catch {
      console.warn('⚠️  No read/write permissions:', expanded);
      return {
        valid: false,
        error: 'No read/write permissions',
        expanded
      };
    }

    // Additional safety check: ensure directory is accessible
    try {
      fs.readdirSync(expanded);
    } catch {
      console.warn('⚠️  Directory not accessible:', expanded);
      return {
        valid: false,
        error: 'Directory not accessible (may be deleted or moved)',
        expanded
      };
    }

    console.log('✅ Directory validated:', expanded);
    return {
      valid: true,
      expanded
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Directory validation error:', errorMessage);
    return {
      valid: false,
      error: errorMessage
    };
  }
}

/**
 * Create directory if it doesn't exist (including parent directories)
 */
export function ensureDirectory(dirPath: string): boolean {
  try {
    const expanded = expandPath(dirPath);

    if (fs.existsSync(expanded)) {
      console.log('📁 Directory already exists:', expanded);
      return true;
    }

    // Create directory recursively
    fs.mkdirSync(expanded, { recursive: true });
    console.log('✅ Directory created:', expanded);
    return true;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to create directory:', errorMessage);
    return false;
  }
}

/**
 * Get platform-specific information for diagnostic logging
 */
export function getPlatformInfo(): {
  os: string;
  platform: string;
  home: string;
  arch: string;
  version: string;
} {
  const info = {
    os: os.type(),
    platform: os.platform(),
    home: os.homedir(),
    arch: os.arch(),
    version: os.release()
  };

  console.log('💻 Platform info:', info);
  return info;
}
