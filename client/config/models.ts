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
    id: 'opus',
    name: 'Claude Opus 4.1',
    description: 'Most advanced model, excelling in all-round tasks',
    apiModelId: 'claude-opus-4-1',
  },
  {
    id: 'sonnet',
    name: 'Claude Sonnet 4.5',
    description: 'Balanced performance for general use',
    apiModelId: 'claude-sonnet-4-5',
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
