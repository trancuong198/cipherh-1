/**
 * Utility functions for working with OpenAI models
 */

/**
 * Check if a model is a reasoning model that doesn't support custom temperature
 * Reasoning models (o1, o3, gpt-5) only support default temperature value of 1
 * 
 * @param model - The model name/id
 * @returns true if the model is a reasoning model
 */
export function isReasoningModel(model: string): boolean {
  const reasoningModelPrefixes = ['o1', 'o3', 'gpt-5'];
  return reasoningModelPrefixes.some(prefix => model.toLowerCase().startsWith(prefix));
}
