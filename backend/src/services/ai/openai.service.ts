import OpenAI from 'openai';
import { ENV } from '../../config/env';
import { logger } from '../../utils/logger';

export interface MessageInterpretation {
  intent:
    | 'GENERAL_QUESTION'
    | 'PROPERTY_SEARCH'
    | 'PROPERTY_SEARCH_MORE'
    | 'PROPERTY_DETAILS'
    | 'OUT_OF_SCOPE'
    | 'GREETING'
    | 'FLOW_ANSWER'
    | 'LEAD_CAPTURE'
    | 'CONVERSATION';
  extractedCriteria: {
    location?: string;
    bhk?: string;
    budget?: string;
    budgetNum?: number;
    intent?: 'buy' | 'rent';
    mustHave?: string;
    targetProjectName?: string;
    name?: string;
    phone?: string;
    email?: string;
    relaxBudget?: boolean;
  };
  referencedPropertyIndex?: number;
  attributeRequested?: 'price' | 'amenities' | 'location' | 'configuration' | 'all';
  requiresDirectAnswer: boolean;
  requiresPropertyRetrieval: boolean;
  answerGuidance?: string;
}

export interface AIServiceResponse {
  text: string;
  source: 'openai' | 'fallback';
}

export class OpenAIService {
  private client: OpenAI | null = null;
  private modelName: string;

  constructor() {
    this.modelName = ENV.OPENAI_MODEL || 'gpt-4o-mini';
    if (ENV.OPENAI_API_KEY && ENV.OPENAI_API_KEY.trim() !== '') {
      try {
        this.client = new OpenAI({
          apiKey: ENV.OPENAI_API_KEY,
        });
        logger.info(`OpenAI client initialized (configured model: ${this.modelName})`);
      } catch (err: any) {
        logger.warn(`Failed to initialize OpenAI client: ${err.message}`);
      }
    } else {
      logger.info('No OPENAI_API_KEY configured. Running with grounded rule-based AI fallback.');
    }
  }

  /**
   * Check if an active OpenAI client is configured
   */
  isConfigured(): boolean {
    return Boolean(this.client && ENV.OPENAI_API_KEY && ENV.OPENAI_API_KEY.trim() !== '');
  }

  /**
   * LLM-First User Message Interpretation
   * Uses OpenAI with structured JSON output to analyze intent, extract criteria,
   * resolve contextual follow-ups, and decide whether direct answers or RAG retrieval are needed.
   */
  async interpretMessage(params: {
    userMessage: string;
    conversationHistorySummary?: string;
    currentUserState?: {
      userName?: string;
      intent?: string;
      location?: string;
      bhk?: string;
      budget?: string;
      pendingQuestion?: string;
      displayedPropertyTitles?: string[];
    };
  }): Promise<MessageInterpretation> {
    if (!this.client) {
      return this.fallbackInterpretMessage(params.userMessage, params.currentUserState);
    }

    try {
      const state = params.currentUserState || {};
      const systemPrompt = `You are the Conversational Intelligence Engine for BRIM Real Estate Assistant in Ahmedabad, Gujarat, India.
Analyze the user message in the context of recent chat history and current user state.
Return a valid JSON object matching this schema:
{
  "intent": "GENERAL_QUESTION" | "PROPERTY_SEARCH" | "PROPERTY_SEARCH_MORE" | "PROPERTY_DETAILS" | "OUT_OF_SCOPE" | "GREETING" | "FLOW_ANSWER" | "LEAD_CAPTURE" | "CONVERSATION",
  "extractedCriteria": {
    "location": string | null,
    "bhk": string | null,
    "budget": string | null,
    "budgetNum": number | null, // In Lakhs (e.g., 1 Cr = 100, 80 Lakhs = 80)
    "intent": "buy" | "rent" | null,
    "mustHave": string | null,
    "targetProjectName": string | null,
    "name": string | null,
    "phone": string | null,
    "email": string | null,
    "relaxBudget": boolean
  },
  "referencedPropertyIndex": number | null,
  "attributeRequested": "price" | "amenities" | "location" | "configuration" | "all",
  "requiresDirectAnswer": boolean,
  "requiresPropertyRetrieval": boolean,
  "answerGuidance": string
}

Intent Classification Guidelines:
1. "GENERAL_QUESTION": User asks any informational, advisory, comparison, or conceptual question (e.g., "is SG Highway a good area for property investment?", "what are the risks of buying under-construction?", "why buy rather than rent?", "what is RERA?", "explain ready-to-move properties", "is Bodakdev better than Gota?"). Do NOT classify these as property search or discovery clarification!
2. "PROPERTY_SEARCH": User explicitly wants to view, find, browse, or explore property listings/cards (e.g., "show me 3 BHK in Science City", "now show 2 BHK properties there", "explore other properties", "find flats in Bodakdev").
3. "PROPERTY_SEARCH_MORE": User requests more options or next batch of properties ("show me more", "more options", "next properties").
4. "PROPERTY_DETAILS": Inquiring about a specific property or previously displayed card ("what is the price of the second one?", "tell me about Aahvan Greens", "does the first one have parking?").
5. "OUT_OF_SCOPE": Completely unrelated to real estate (cricket, movies, recipes, coding, world politics).
6. "GREETING": Pure greeting/salutation without criteria or question ("hi", "hello", "good morning").
7. "FLOW_ANSWER": User directly providing an answer to the pending question (e.g. giving their name "Rahul", or selecting "Looking to buy").
8. "LEAD_CAPTURE": User providing contact phone or email.
9. "CONVERSATION": Thanks, ok, cool, bye.

Context Resolution Rules:
- If user refers to previous locality ("there", "in that area", "same place"), resolve location to "${state.location || ''}".
- If user requests a new locality (e.g. "Actually forget Bodakdev, what about Gota?"), location is "Gota".
- If user clicks or says "explore other properties" or searches without budget, set relaxBudget to true.
- If user refers to "first one"/"first property" -> referencedPropertyIndex: 0. "second one" -> 1. "third one" -> 2.`;

      const userPrompt = `
Current User State:
- Name: ${state.userName || 'Unknown'}
- Preferred Location: ${state.location || 'None'}
- Preferred BHK: ${state.bhk || 'None'}
- Preferred Budget: ${state.budget || 'None'}
- Pending Question: ${state.pendingQuestion || 'None'}
- Previously Displayed Cards: ${(state.displayedPropertyTitles || []).join(', ') || 'None'}

Recent Conversation Context:
${params.conversationHistorySummary || 'New conversation'}

User Message: "${params.userMessage}"

Respond with JSON.
`.trim();

      const completion = await this.client.chat.completions.create(
        {
          model: this.modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_tokens: 350,
        },
        { timeout: 5000 }
      );

      const content = completion.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        return {
          intent: parsed.intent || 'CONVERSATION',
          extractedCriteria: {
            location: parsed.extractedCriteria?.location || undefined,
            bhk: parsed.extractedCriteria?.bhk || undefined,
            budget: parsed.extractedCriteria?.budget || undefined,
            budgetNum: typeof parsed.extractedCriteria?.budgetNum === 'number' ? parsed.extractedCriteria.budgetNum : undefined,
            intent: parsed.extractedCriteria?.intent || undefined,
            mustHave: parsed.extractedCriteria?.mustHave || undefined,
            targetProjectName: parsed.extractedCriteria?.targetProjectName || undefined,
            name: parsed.extractedCriteria?.name || undefined,
            phone: parsed.extractedCriteria?.phone || undefined,
            email: parsed.extractedCriteria?.email || undefined,
            relaxBudget: Boolean(parsed.extractedCriteria?.relaxBudget),
          },
          referencedPropertyIndex: typeof parsed.referencedPropertyIndex === 'number' ? parsed.referencedPropertyIndex : undefined,
          attributeRequested: parsed.attributeRequested || 'all',
          requiresDirectAnswer: Boolean(parsed.requiresDirectAnswer),
          requiresPropertyRetrieval: Boolean(parsed.requiresPropertyRetrieval),
          answerGuidance: parsed.answerGuidance || undefined,
        };
      }
    } catch (err: any) {
      logger.warn(`OpenAI interpretMessage error: ${err.message}. Using fallback interpretation.`);
    }

    return this.fallbackInterpretMessage(params.userMessage, params.currentUserState);
  }

  /**
   * Safe, deterministic fallback message interpreter when AI model is temporarily unreachable
   */
  fallbackInterpretMessage(
    userMessage: string,
    currentUserState?: any
  ): MessageInterpretation {
    const tl = userMessage.toLowerCase().trim();

    // 1. Out of scope
    if (/\b(cricket|football|movie|movies|recipe|pizza|burger|python|code|debug|sing|joke|capital of)\b/i.test(tl)) {
      return {
        intent: 'OUT_OF_SCOPE',
        extractedCriteria: {},
        requiresDirectAnswer: true,
        requiresPropertyRetrieval: false,
      };
    }

    // 2. Property search more
    if (/\b(show me more|more options|other options|show more)\b/i.test(tl)) {
      return {
        intent: 'PROPERTY_SEARCH_MORE',
        extractedCriteria: {},
        requiresDirectAnswer: false,
        requiresPropertyRetrieval: true,
      };
    }

    // 3. Follow-up reference on property
    if (/\b(first|second|third|1st|2nd|3rd)\s+(one|property|project)\b/i.test(tl) || (tl.includes('price of') && currentUserState?.displayedPropertyTitles?.length)) {
      let idx = 0;
      if (tl.includes('second') || tl.includes('2nd')) idx = 1;
      else if (tl.includes('third') || tl.includes('3rd')) idx = 2;
      return {
        intent: 'PROPERTY_DETAILS',
        referencedPropertyIndex: idx,
        attributeRequested: tl.includes('price') ? 'price' : tl.includes('amenities') ? 'amenities' : 'all',
        extractedCriteria: {},
        requiresDirectAnswer: true,
        requiresPropertyRetrieval: false,
      };
    }

    // 4. General real estate question
    const isQuestion = tl.includes('?') || /\b(why|what is|how to|is it|is [a-zA-Z\s]+ good|risks of|difference between|explain|pros and cons)\b/i.test(tl);
    const isSearchWord = /\b(show me|find me|recommend|options in|properties in|flats in)\b/i.test(tl);

    if (isQuestion && !isSearchWord) {
      return {
        intent: 'GENERAL_QUESTION',
        extractedCriteria: {},
        requiresDirectAnswer: true,
        requiresPropertyRetrieval: false,
      };
    }

    // 5. Explicit Property search
    if (isSearchWord || tl.includes('explore other') || tl.includes('bhk')) {
      const relaxBudget = tl.includes('explore other') || tl.includes('other properties');
      return {
        intent: 'PROPERTY_SEARCH',
        extractedCriteria: { relaxBudget },
        requiresDirectAnswer: false,
        requiresPropertyRetrieval: true,
      };
    }

    // 6. Greetings
    if (/^(hi|hello|hey|good morning|namaste)[\s!.]*$/i.test(tl)) {
      return {
        intent: 'GREETING',
        extractedCriteria: {},
        requiresDirectAnswer: true,
        requiresPropertyRetrieval: false,
      };
    }

    return {
      intent: 'CONVERSATION',
      extractedCriteria: {},
      requiresDirectAnswer: true,
      requiresPropertyRetrieval: false,
    };
  }

  /**
   * Generate text using OpenAI with strict grounding, model fallback, and resilient error handling
   */
  async generateResponse(
    systemPrompt: string,
    userMessage: string,
    groundedContext: string = '',
    temperature = 0.2
  ): Promise<AIServiceResponse> {
    if (!this.client) {
      return {
        text: this.generateGroundedFallback(userMessage, groundedContext),
        source: 'fallback',
      };
    }

    const candidateModels = Array.from(
      new Set([
        this.modelName,
        'gpt-4o-mini',
        'gpt-4o',
        'gpt-3.5-turbo',
      ])
    );

    for (const mName of candidateModels) {
      try {
        const hasKnowledge = groundedContext && groundedContext.trim().length > 10;
        const prompt = hasKnowledge
          ? `
=== USER QUERY ===
${userMessage}

=== VERIFIED RETRIEVED WEBSITE KNOWLEDGE ===
${groundedContext}

Please respond to the user concisely in 1-2 brief paragraphs (under 90 words) based on the verified website knowledge above. 
Highlight top matching properties with bold names (e.g. **Ananta**, **Satyamev Serene**). 
Interactive cards will display full details below, so keep this text crisp and inviting without reproducing a large bullet list. Do NOT include raw source tags like [Source 1: ...].
`.trim()
          : `
=== USER QUERY ===
${userMessage}

Please answer the user's question clearly, warmly, and concisely (under 90 words).
Provide expert, helpful real estate guidance relevant to Ahmedabad and property buyers.
Do not invent specific unverified property prices or availability.
`.trim();

        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: prompt,
          },
        ];

        // Fast, crisp completion bounded to 300 tokens (typically 0.8-1.4s)
        const startTime = Date.now();
        const completion = await this.client.chat.completions.create(
          {
            model: mName,
            messages,
            temperature,
            max_tokens: 300,
          },
          {
            timeout: 10000,
          }
        );

        const durationMs = Date.now() - startTime;
        logger.info(`OpenAI chat completion completed in ${durationMs}ms using model: ${mName}`);

        const candidateText = completion.choices?.[0]?.message?.content;
        if (candidateText && candidateText.trim() !== '') {
          return {
            text: candidateText.trim(),
            source: 'openai',
          };
        }
      } catch (error: any) {
        const errMsg = error?.message || 'Unknown OpenAI error';
        const status = error?.status || error?.statusCode;

        // Authentication failure (401): invalid key, stop retrying models
        if (status === 401 || errMsg.toLowerCase().includes('incorrect api key') || errMsg.toLowerCase().includes('invalid api key')) {
          logger.warn(`OpenAI authentication failed: ${errMsg}. Please check OPENAI_API_KEY.`);
          break;
        }

        // Rate limit / Quota exceeded (429): stop retrying models
        if (status === 429 || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('rate limit')) {
          logger.warn(`OpenAI rate limit or quota exceeded: ${errMsg}. Falling back gracefully.`);
          break;
        }

        // Model not found or not permitted (404/403): try next candidate model
        logger.warn(`OpenAI model ${mName} attempt failed: ${errMsg}. Trying next candidate model...`);
      }
    }

    return {
      text: this.generateGroundedFallback(userMessage, groundedContext),
      source: 'fallback',
    };
  }

  /**
   * Resilient, beautifully formatted fallback response generator when AI provider is unavailable
   */
  generateGroundedFallback(userMessage: string, groundedContext: string): string {
    const msg = userMessage.toLowerCase();

    // Check if grounded context contains property details
    if (groundedContext && groundedContext.trim().length > 20) {
      const projects: Array<{
        name?: string;
        developer?: string;
        price?: string;
        area?: string;
        location?: string;
        bhk?: string;
        amenities?: string;
      }> = [];

      // Clean away raw [Source ...] headers and split by project/source blocks
      const cleanBlocks = groundedContext
        .replace(/\[Source\s+\d+:[^\]]+\]/gi, '')
        .split(/(?:---|\n\s*\n)/)
        .map((b) => b.trim())
        .filter((b) => b.length > 15);

      for (const block of cleanBlocks) {
        const projMatch = block.match(/Project:\s*([^\n]+)/i);
        const devMatch = block.match(/Developer:\s*([^\n]+)/i);
        const priceMatch = block.match(/Price:\s*([^\n]+)/i);
        const areaMatch = block.match(/Area:\s*([^\n]+)/i);
        const locMatch = block.match(/Location:\s*([^\n]+)/i);
        const configMatch = block.match(/Configuration:\s*([^\n]+)/i);
        const amenMatch = block.match(/Amenities:\s*([^\n]+)/i);

        if (projMatch || priceMatch || configMatch) {
          projects.push({
            name: projMatch ? projMatch[1].trim() : undefined,
            developer: devMatch ? devMatch[1].trim() : undefined,
            price: priceMatch ? priceMatch[1].trim() : undefined,
            area: areaMatch ? areaMatch[1].trim() : undefined,
            location: locMatch ? locMatch[1].trim() : undefined,
            bhk: configMatch ? configMatch[1].trim() : undefined,
            amenities: amenMatch ? amenMatch[1].trim() : undefined,
          });
        }
      }

      if (projects.length > 0) {
        let response = `Here are the verified properties available based on our website records:\n\n`;
        const shownProjects = projects.slice(0, 3);

        for (const p of shownProjects) {
          response += `### 🏢 ${p.name || 'Featured Property'}${p.developer ? ` *(by ${p.developer})*` : ''}\n`;
          if (p.location) response += `- **Location:** ${p.location}\n`;
          if (p.bhk) response += `- **Configuration:** ${p.bhk}\n`;
          if (p.price) response += `- **Pricing:** ${p.price}\n`;
          if (p.area) response += `- **Super Built-Up Area:** ${p.area}\n`;
          if (p.amenities) response += `- **Key Amenities:** ${p.amenities}\n`;
          response += `\n`;
        }

        response += `Would you like me to share the detailed project brochure, floor plans, or pricing breakdown over WhatsApp or Email?`;
        return response.trim();
      }

      // If text is descriptive without strict key-value pairs, clean up noise and summarize neatly
      const cleanLines = groundedContext
        .replace(/\[Source\s+\d+:[^\]]+\]/gi, '')
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => {
          if (l.length < 10) return false;
          if (/Property Type\s*3BHK|GandhinagarProperty|Vaishnodevi Chandkheda/i.test(l)) return false;
          return true;
        });

      if (cleanLines.length > 0) {
        const topSummary = cleanLines.slice(0, 4).join('\n\n');
        return `Based on our verified website records:\n\n${topSummary}\n\nWould you like me to share the complete brochure and pricing details over WhatsApp or Email?`;
      }
    }

    if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) {
      return 'Hi there 👋 Welcome to Prycoons Real Estate! How can I assist you with your home search or project questions today?';
    }

    return "I'm currently checking our verified website records for the latest project availability. Could you let me know your preferred location (such as Gota, Tragad, Science City, or Ambli) or your budget range?";
  }
}

export const openaiService = new OpenAIService();
