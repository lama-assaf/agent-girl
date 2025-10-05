/**
 * Model Configuration
 *
 * Centralized definitions for all available AI models.
 * Add new models here to make them available in the UI.
 */

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  apiModelId?: string;
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
    description: 'Anthropic\'s most intelligent model for complex agents and coding (September 29, 2025)',
    apiModelId: 'claude-sonnet-4-5-20250929',
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
