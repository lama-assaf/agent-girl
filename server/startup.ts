/**
 * Startup & Environment Module
 * Handles environment detection, configuration loading, and initialization
 */

import path from "path";
import { readFileSync, existsSync, appendFileSync } from "fs";

// Determine if running in standalone mode
const IS_STANDALONE = process.env.STANDALONE_BUILD === 'true';

/**
 * Debug logging function
 * In standalone mode: only writes to debug log file (silent in console)
 * In dev mode: writes to console for debugging
 */
export const debugLog = (message: string): void => {
  if (IS_STANDALONE) {
    try {
      const logPath = path.join(path.dirname(process.execPath), 'agent-girl-debug.log');
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${message}\n`;
      appendFileSync(logPath, logMessage, 'utf-8');
    } catch (e) {
      console.error('Failed to write debug log:', e);
    }
  } else {
    console.log(message);
  }
};

/**
 * Get the directory where the binary/script is located
 * In source-based releases, the launcher script already cd's to the right directory,
 * so we just use process.cwd() which is already correct
 */
const getBinaryDir = (): string => {
  return process.cwd();
};

export interface StartupConfig {
  isStandalone: boolean;
  binaryDir: string;
  debugLog: (message: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  postcss: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tailwindcss: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  autoprefixer: any;
}

/**
 * Initialize startup configuration
 * Loads environment variables and sets up PostCSS (dev mode only)
 */
export async function initializeStartup(): Promise<StartupConfig> {
  const BINARY_DIR = getBinaryDir();

  debugLog('🔍 Startup diagnostics:');
  debugLog(`  - IS_STANDALONE: ${IS_STANDALONE}`);
  debugLog(`  - STANDALONE_BUILD env: ${process.env.STANDALONE_BUILD}`);
  debugLog(`  - process.execPath: ${process.execPath}`);
  debugLog(`  - process.cwd(): ${process.cwd()}`);
  debugLog(`  - BINARY_DIR: ${BINARY_DIR}`);

  // Conditionally import PostCSS only in dev mode (not standalone)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let postcss: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tailwindcss: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let autoprefixer: any = null;

  if (!IS_STANDALONE) {
    postcss = (await import('postcss')).default;
    tailwindcss = (await import('@tailwindcss/postcss')).default;
    autoprefixer = (await import('autoprefixer')).default;
  }

  // Load environment variables
  // In standalone mode, manually parse .env from binary directory
  // In dev mode, use dotenv/config from project root
  if (IS_STANDALONE) {
    const envPath = path.join(BINARY_DIR, '.env');
    debugLog(`  - Looking for .env at: ${envPath}`);
    debugLog(`  - .env exists: ${existsSync(envPath)}`);

    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, 'utf-8');
      debugLog(`  - .env file size: ${envContent.length} bytes`);

      let keysLoaded = 0;
      envContent.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith('#')) return;

        const match = trimmedLine.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();

          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }

          process.env[key] = value;
          keysLoaded++;
          // Only log the key name, not the value (for security)
          if (key === 'ANTHROPIC_API_KEY' || key === 'ZAI_API_KEY') {
            debugLog(`  - Loaded ${key}: ${value.substring(0, 10)}...`);
          }
        }
      });
      debugLog(`✅ Loaded .env from: ${envPath} (${keysLoaded} keys)`);
    } else {
      debugLog(`⚠️  .env file not found at: ${envPath}`);
    }
  } else {
    debugLog('  - Using dotenv/config (dev mode)');
    await import("dotenv/config");
  }

  debugLog(`  - ANTHROPIC_API_KEY set: ${!!process.env.ANTHROPIC_API_KEY}`);
  debugLog(`  - ZAI_API_KEY set: ${!!process.env.ZAI_API_KEY}`);

  return {
    isStandalone: IS_STANDALONE,
    binaryDir: BINARY_DIR,
    debugLog,
    postcss,
    tailwindcss,
    autoprefixer,
  };
}
