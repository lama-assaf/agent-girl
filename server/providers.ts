import type { ProviderType } from '../client/config/models';

export interface ProviderConfig {
  baseUrl?: string;
  apiKey: string;
  name: string;
}

/**
 * Provider configurations
 * Maps provider types to their API configurations
 * This is a getter function to ensure API keys are read from process.env at runtime,
 * not at module initialization time (which happens before .env is loaded in standalone mode)
 */
export function getProviders(): Record<ProviderType, ProviderConfig> {
  return {
    'anthropic': {
      // No baseUrl = uses default Anthropic endpoint (https://api.anthropic.com)
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      name: 'Anthropic',
    },
    'z-ai': {
      baseUrl: 'https://api.z.ai/api/anthropic',
      apiKey: process.env.ZAI_API_KEY || '',
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
