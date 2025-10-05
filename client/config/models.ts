/**
 * Model Configuration
 *
 * Centralized definitions for all available AI models.
 * Add new models here to make them available in the UI.
 */

export type ProviderType = 'anthropic' | 'z-ai';

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  apiModelId: string;
  provider: ProviderType;
}

/**
 * Available Models
 *
 * Add new models to this array to make them available in the model selector.
 */
export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: 'sonnet',
    name: 'Claude Sonnet 4.5',
    description: 'Anthropic\'s most intelligent model for complex agents and coding',
    apiModelId: 'claude-sonnet-4-5-20250929',
    provider: 'anthropic',
  },
  {
    id: 'glm-4.6',
    name: 'GLM 4.6',
    description: 'Z.AI\'s flagship model for powerful reasoning and coding',
    apiModelId: 'glm-4.6',
    provider: 'z-ai',
  },
];

/**
 * Get model configuration by ID
 */
export function getModelConfig(modelId: string): ModelConfig | undefined {
  return AVAILABLE_MODELS.find(m => m.id === modelId);
}

/**
 * Get the default model
 */
export function getDefaultModel(): ModelConfig {
  return AVAILABLE_MODELS[0];
}
