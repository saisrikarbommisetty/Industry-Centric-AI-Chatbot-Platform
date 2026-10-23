/**
 * Compatibility wrapper for transition from Gemini to OpenAI
 * Routes all AI generation calls to OpenAIService
 */
import { openaiService, OpenAIService, AIServiceResponse } from './openai.service';

export { OpenAIService as GeminiService, AIServiceResponse };
export const geminiService = openaiService;
