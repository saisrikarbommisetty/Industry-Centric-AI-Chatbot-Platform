import OpenAI from 'openai';
import { ENV } from '../../config/env';
import { logger } from '../../utils/logger';
import { extractIndianMobileFromText } from '../../utils/phone';
import { extractPersonNameFromText } from '../../config/greetings';

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

function truncateSafe(text: string | undefined | null, maxChars: number): string {
  if (!text) return '';
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '... [truncated]';
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
    botConfig?: {
      botName?: string;
      industry?: string;
      industryName?: string;
    };
  }): Promise<MessageInterpretation> {
    if (!this.client) {
      return this.fallbackInterpretMessage(params.userMessage, params.currentUserState, params.botConfig);
    }

    try {
      const state = params.currentUserState || {};
      const botName = params.botConfig?.botName || 'Prycoons Real Estate Assistant';
      const industryName = params.botConfig?.industryName || 'Real Estate';
      const isRealEstate = (params.botConfig?.industry === 'real-estate' || !params.botConfig) && params.botConfig?.industry !== 'healthcare' && params.botConfig?.industry !== 'education';

      const systemPrompt = isRealEstate
        ? `You are the Conversational Intelligence Engine for Prycoons Real Estate Assistant in Ahmedabad, Gujarat, India.
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

- Context Resolution Rules:
- If user refers to previous locality ("there", "in that area", "same place"), resolve location to "${state.location || ''}".
- If user requests a new locality (e.g. "Actually forget Bodakdev, what about Gota?"), location is "Gota".
- If user clicks or says "explore other properties" or searches without budget, set relaxBudget to true.
- If user refers to "first one"/"first property" -> referencedPropertyIndex: 0. "second one" -> 1. "third one" -> 2.
- INTENT (BUY/RENT) EXTRACTION: Set "intent" in extractedCriteria to "buy" or "rent" ONLY if the user has genuinely expressed their personal search requirement (e.g., "I want to buy a property", "looking to rent a flat", "I'm looking to buy").
- NEVER assume or default intent! If the user asks an advisory/comparison question (e.g., "Should I buy or rent?", "Is it better to buy or rent?", "Difference between buying and renting"), intent MUST BE NULL, and the main intent MUST be "GENERAL_QUESTION"!
- NAME EXTRACTION: Extract "name" ONLY when user genuinely introduces themselves (e.g. "I am Rahul", "Rahul", "My name is Priya", "Call me Rahul"). If the user says "Call me Rahul", extract name: "Rahul", do NOT interpret the word "call" as a property search intent, and do NOT infer BUY or RENT.
- NEVER extract words like "yes", "yeah", "yep", "sure", "ok", "okay", "fine", "no", "skip", "buy", "rent", "explore" as a name! If user says "yes" or answers affirmatively, name MUST be null, and intent should be "FLOW_ANSWER".
- PREFERENCE UPDATES: If user changes a requirement (e.g. "Actually, show me 2BHK properties instead"), extract the updated criteria (bhk: "2 BHK") and classify intent as "PROPERTY_SEARCH".`
        : `You are the Conversational Intelligence Engine for ${botName} (${industryName}).
Analyze the user message in the context of recent chat history and current conversation state.
Return a valid JSON object matching this schema:
{
  "intent": "GENERAL_QUESTION" | "OUT_OF_SCOPE" | "GREETING" | "FLOW_ANSWER" | "LEAD_CAPTURE" | "CONVERSATION",
  "extractedCriteria": {
    "name": string | null,
    "phone": string | null,
    "email": string | null
  },
  "requiresDirectAnswer": boolean,
  "requiresPropertyRetrieval": boolean,
  "answerGuidance": string
}`;

      const safeHistory = truncateSafe(params.conversationHistorySummary, 3000);
      const safeUserMsg = truncateSafe(params.userMessage, 1500);

      const userPrompt = `
Current User State:
- Name: ${state.userName || 'Unknown'}
- Preferred Location: ${state.location || 'None'}
- Preferred BHK: ${state.bhk || 'None'}
- Preferred Budget: ${state.budget || 'None'}
- Pending Question: ${state.pendingQuestion || 'None'}
- Previously Displayed Cards: ${(state.displayedPropertyTitles || []).join(', ') || 'None'}

Recent Conversation Context:
${safeHistory || 'New conversation'}

User Message: "${safeUserMsg}"

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
    currentUserState?: any,
    botConfig?: { botName?: string; industry?: string; industryName?: string }
  ): MessageInterpretation {
    const tl = userMessage.toLowerCase().trim();
    const isRealEstate = (botConfig?.industry === 'real-estate' || !botConfig) && botConfig?.industry !== 'healthcare' && botConfig?.industry !== 'education';

    // 1. Out of scope
    if (/\b(cricket|football|movie|movies|recipe|pizza|burger|python|code|debug|sing|joke|capital of)\b/i.test(tl)) {
      return {
        intent: 'OUT_OF_SCOPE',
        extractedCriteria: {},
        requiresDirectAnswer: true,
        requiresPropertyRetrieval: false,
      };
    }

    // 1.5 Phone & combo name+phone detection
    const mobileFound = extractIndianMobileFromText(userMessage);
    const candidateName = extractPersonNameFromText(userMessage);
    if (mobileFound) {
      return {
        intent: 'LEAD_CAPTURE',
        extractedCriteria: {
          phone: mobileFound.normalized,
          ...(candidateName ? { name: candidateName } : {}),
        },
        requiresDirectAnswer: true,
        requiresPropertyRetrieval: false,
      };
    }

    // 1.6 Greeting
    if (/^(hi|hello|hey|good morning|namaste)[\s!.]*$/i.test(tl)) {
      return {
        intent: 'GREETING',
        extractedCriteria: {},
        requiresDirectAnswer: true,
        requiresPropertyRetrieval: false,
      };
    }

    // If not a real estate bot, treat inquiries as knowledge questions or general conversation
    if (!isRealEstate) {
      if (candidateName) {
        return {
          intent: 'CONVERSATION',
          extractedCriteria: { name: candidateName },
          requiresDirectAnswer: true,
          requiresPropertyRetrieval: false,
        };
      }
      return {
        intent: 'GENERAL_QUESTION',
        extractedCriteria: {},
        requiresDirectAnswer: true,
        requiresPropertyRetrieval: true,
      };
    }

    // 2. Property search more (real estate only)
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
    const isQuestion = tl.includes('?') || /\b(why|what is|what does|how to|is it|is [a-zA-Z\s]+ good|risks of|difference between|explain|pros and cons|should i|better to|mean|meaning)\b/i.test(tl);
    const isSearchWord = /\b(show me|find me|recommend|options in|properties in|flats in|list of)\b/i.test(tl);

    if (isQuestion && !isSearchWord) {
      return {
        intent: 'GENERAL_QUESTION',
        extractedCriteria: {},
        requiresDirectAnswer: true,
        requiresPropertyRetrieval: false,
      };
    }

    // 5. Property search or Criteria Declaration
    const hasBhk = /\b([1-5])\s*bhk\b/i.test(tl) || /\b(one|two|three|four|five)\s*bhk\b/i.test(tl);
    const hasCr = /(cr|crore|crores)/i.test(tl);
    const hasBuy = (/\b(want to buy|looking to buy|buy a|to buy|buying|buy)\b/i.test(tl) || hasCr) && !/\b(should i|vs|or rent)\b/i.test(tl);
    const hasRent = /\b(want to rent|looking to rent|rent a|to rent|renting|rent)\b/i.test(tl) && !/\b(should i|vs|or buy)\b/i.test(tl);

    let bhkMatch: string | undefined = undefined;
    const bMatch = tl.match(/\b([1-5])\s*bhk\b/i);
    if (bMatch) bhkMatch = `${bMatch[1]} BHK`;

    let locMatch: string | undefined = undefined;
    const locNames = ['gota', 'science city', 'sola', 'bodakdev', 'ambli', 'tragad', 'chandkheda', 'thaltej', 'vastrapur', 'prahlad nagar'];
    for (const loc of locNames) {
      if (tl.includes(loc)) {
        locMatch = loc.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        break;
      }
    }

    if (isSearchWord || tl.includes('explore other') || hasBhk || hasBuy || hasRent || locMatch) {
      const relaxBudget = tl.includes('explore other') || tl.includes('other properties');
      const intentVal: 'buy' | 'rent' | undefined = hasRent ? 'rent' : (hasBuy || hasBhk || tl.includes('looking for') || tl.includes('looking')) ? 'buy' : undefined;
      return {
        intent: (isSearchWord || (hasBhk && locMatch)) ? 'PROPERTY_SEARCH' : 'FLOW_ANSWER',
        extractedCriteria: {
          relaxBudget,
          bhk: bhkMatch,
          location: locMatch,
          intent: intentVal,
        },
        requiresDirectAnswer: false,
        requiresPropertyRetrieval: Boolean(isSearchWord || (hasBhk && locMatch)),
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

    if (candidateName) {
      return {
        intent: 'CONVERSATION',
        extractedCriteria: {
          name: candidateName,
        },
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
    temperatureOrConfig?: number | { botName?: string; industry?: string; industryName?: string; isRealEstate?: boolean; websiteUrl?: string; systemInstructions?: string; description?: string },
    botConfigArg?: { botName?: string; industry?: string; industryName?: string; isRealEstate?: boolean; websiteUrl?: string; systemInstructions?: string; description?: string }
  ): Promise<AIServiceResponse> {
    const temperature = typeof temperatureOrConfig === 'number' ? temperatureOrConfig : 0.2;
    const resolvedBotConfig = (typeof temperatureOrConfig === 'object' && temperatureOrConfig !== null ? temperatureOrConfig : botConfigArg) as any;
    const botConfig = resolvedBotConfig;

    if (!this.client) {
      return {
        text: this.generateGroundedFallback(userMessage, groundedContext, botConfig),
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

    const botName = botConfig?.botName || 'our business';
    const isPrycoons = botName.toLowerCase().includes('prycoons');
    const isRealEstate = botConfig?.isRealEstate !== undefined
      ? botConfig.isRealEstate
      : (botConfig?.industry === 'real-estate' || (!botConfig?.industry && !botConfig?.botName));

    // Token / Context Window Overflow Guard: strictly enforce safe bounds
    // gpt-4o-mini max context is 128k tokens; keeping total input under ~25k chars (~6k tokens) guarantees no context overflow
    const safeSystemPrompt = truncateSafe(systemPrompt, 12000);
    const safeUserMessage = truncateSafe(userMessage, 3000);
    const safeGroundedContext = truncateSafe(groundedContext, 10000);

    for (const mName of candidateModels) {
      try {
        const hasKnowledge = safeGroundedContext && safeGroundedContext.trim().length > 10;
        const prompt = hasKnowledge
          ? `
=== USER QUERY ===
${safeUserMessage}

=== VERIFIED RETRIEVED WEBSITE KNOWLEDGE ===
${safeGroundedContext}

${isRealEstate 
  ? `Please respond concisely in 1-2 brief paragraphs (under 90 words) strictly based on the verified website knowledge above for ${botName}.${isPrycoons ? ' Highlight top matching properties with bold names (e.g. **Ananta**).' : ' Highlight verified properties or services from the knowledge base.'}` 
  : `Answer the user's question directly, accurately, and concisely in 1-2 brief sentences (strictly under 60-70 words) based strictly on the verified website knowledge above for ${botName}. Get straight to the answer without lengthy preambles, do not dump bullet points or raw metadata labels, and do not repeat system descriptions. If the information is not in the knowledge base, state that simply in one sentence.`}
Do NOT include raw source tags like [Source 1: ...].
`.trim()
          : `
=== USER QUERY ===
${safeUserMessage}

Please answer the user's question clearly, warmly, and concisely (under 90 words).
${isPrycoons ? 'Provide expert, helpful real estate guidance relevant to Ahmedabad and property buyers. Do not invent specific unverified property prices or availability.' : `Represent ${botName} professionally as an assistant in the ${botConfig?.industryName || botConfig?.industry || 'business'} industry. If the user asks about specific business offerings, products, or services that require verified documentation, clearly state that this detail is not confirmed in your knowledge base.`}
`.trim();

        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          {
            role: 'system',
            content: safeSystemPrompt,
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

        // Context limit overflow guard: do not retry same model candidates if context length error
        if (errMsg.toLowerCase().includes('maximum context length') || errMsg.toLowerCase().includes('reduce the length of the messages')) {
          logger.warn(`OpenAI context length exceeded: ${errMsg}. Gracefully falling back to grounded responder.`);
          break;
        }

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
      text: this.generateGroundedFallback(userMessage, groundedContext, botConfig),
      source: 'fallback',
    };
  }

  /**
   * Resilient, beautifully formatted fallback response generator when AI provider is unavailable
   */
  generateGroundedFallback(
    userMessage: string,
    groundedContext: string,
    botConfig?: { botName?: string; industry?: string; industryName?: string; isRealEstate?: boolean }
  ): string {
    const msg = userMessage.toLowerCase();
    const isRealEstate = botConfig?.isRealEstate !== undefined
      ? botConfig.isRealEstate
      : (botConfig?.industry === 'real-estate' || (!botConfig?.industry && !botConfig?.botName));
    const botName = botConfig?.botName || 'our business';

    // Multi-Industry Grounded Fallback for non-real-estate bots
    if (!isRealEstate) {
      if (groundedContext && groundedContext.trim().length > 10) {
        // 1. Clean away [Source ...] headers
        const rawLines = groundedContext
          .replace(/\[Source\s+\d+:[^\]]+\]/gi, '')
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 5 && !l.startsWith('---') && !/Under Construction|GandhinagarProperty/i.test(l));

        // 2. Filter out raw system labels and extract informative factual statements
        const informativeLines = rawLines
          .filter((l) => !/^(Assistant Identity & Business Name|Industry & Domain|Operating Instructions & Guidelines):/i.test(l))
          .map((l) => l.replace(/^(Business Overview & Services|Overview & Services|Business Information|Services & Policies|Official Website):\s*/i, '').trim())
          .filter(Boolean);

        // 3. Extract query search terms (ignoring common stop words)
        const stopWords = new Set(['what', 'is', 'the', 'of', 'in', 'for', 'and', 'or', 'a', 'an', 'to', 'your', 'our', 'are', 'you', 'can', 'i', 'me', 'how', 'do', 'does', 'tell', 'about', 'give', 'any']);
        const queryTerms = msg.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !stopWords.has(w));

        const isPriceQuery = /\b(price|pricing|cost|fee|fees|charges|rate|how much)\b/i.test(msg);
        const isTimeQuery = /\b(time|timing|hours|hour|schedule|open|close|when|days)\b/i.test(msg);
        const isServiceQuery = /\b(services?|treatment|treatments?|offer|product|what do you do)\b/i.test(msg);
        const isContactQuery = /\b(contact|email|phone|call|reach|number|address|where|location)\b/i.test(msg);

        // Score each informative sentence
        const scoredLines = informativeLines.map((line) => {
          let score = 0;
          const lineLower = line.toLowerCase();
          for (const t of queryTerms) {
            if (lineLower.includes(t)) score += 4;
          }
          if (isPriceQuery && (line.includes('₹') || line.includes('$') || /\b(cost|price|fee|pricing|charges)\b/i.test(lineLower))) {
            score += 6;
          }
          if (isTimeQuery && /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)|hours|timing|schedule|monday|sunday|saturday|daily)\b/i.test(lineLower)) {
            score += 6;
          }
          if (isServiceQuery && /\b(provides|offers|treatment|surgery|service|care|solutions|programs)\b/i.test(lineLower)) {
            score += 4;
          }
          if (isContactQuery && /\b(https?:\/\/|@|phone|call|\+\d{2}|\b\d{10}\b|located|address)\b/i.test(lineLower)) {
            score += 5;
          }
          return { line, score };
        });

        scoredLines.sort((a, b) => b.score - a.score);
        const bestMatches = scoredLines.filter((sl) => sl.score > 0);

        if (bestMatches.length > 0) {
          // Return the 1-2 most relevant matching statements directly without lengthy filler
          const topLines = bestMatches.slice(0, 2).map((m) => m.line);
          const directAnswer = topLines.join(' ');
          return `Based on our verified website records:\n\n${directAnswer}`;
        }

        // If general query and we have informative lines, output concise overview (under 50 words)
        if (informativeLines.length > 0) {
          const overview = informativeLines.slice(0, 2).join(' ');
          return `At ${botName}, ${overview}`;
        }
      }

      if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) {
        return `Hi there 👋 Welcome to ${botName}! How can I assist you with your questions today?`;
      }

      if (/\b(contact|email|phone|call|reach|number|helpdesk)\b/i.test(msg)) {
        return `You can reach ${botName} through our official website, or share your contact number/email so our team can follow up with you directly.`;
      }

      if (/\b(help|assist|what can you do|services)\b/i.test(msg)) {
        return `I can assist with questions regarding ${botName}'s services, pricing, and information based on verified records. What would you like to know?`;
      }

      if (/\b(thank|thanks|great|cool|awesome|perfect|ok|okay)\b/i.test(msg)) {
        return `You're very welcome! Feel free to ask if you have any other questions about ${botName}.`;
      }

      return `I couldn't find confirmed details for that in the verified records for ${botName}. Would you like our team to contact you directly with more information?`;
    }

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

    if (/\b(amenities|amenity|facilities|facility|gym|pool|clubhouse|garden)\b/i.test(msg)) {
      return "Our featured residential projects in Ahmedabad feature premium modern lifestyle amenities, including Landscaped Zen Gardens, a fully-equipped Clubhouse & Gymnasium, Swimming Pool, Children's Play Area, 24/7 Security, High-Speed Elevators, and EV Charging infrastructure. Let me know if you would like specific amenity details for any particular project!";
    }

    if (/\b(help|assist|how can you|what can you)\b/i.test(msg)) {
      return "I can assist you with discovering verified residential and commercial properties in Ahmedabad, checking configurations and pricing, downloading official project brochures, or arranging private site visits with our property advisory team. What would you like to explore next?";
    }

    if (/\b(thank|thanks|great|cool|awesome|perfect|ok|okay)\b/i.test(msg)) {
      return "You're very welcome! Feel free to ask if you have any questions about properties in Ahmedabad, or let me know if you would like to schedule a site visit or explore more options.";
    }

    if (/\b(buy or rent|rent or buy|difference between buying and renting)\b/i.test(msg)) {
      return "In Ahmedabad, buying property in high-growth corridors like SG Highway, Science City, and Gota offers strong capital appreciation and long-term asset building. Renting provides flexibility with lower upfront commitment. If you plan to settle for 5+ years, purchasing a home is typically the more rewarding choice.";
    }

    if (/\b(price|pricing|rates|budget|cost)\b/i.test(msg)) {
      return "Property prices in Ahmedabad vary by corridor: premium areas like Ambli, Bodakdev, and Science City range from ₹1.65 Cr to ₹3.50+ Cr for luxury 3 & 4 BHK residences, while emerging hubs like Gota and Tragad offer attractive options from ₹55 Lakh to ₹1.10 Cr.";
    }

    return "I'm here to assist with your property search in Ahmedabad! Feel free to ask about project availability, pricing, amenities, or let me know if you would like to explore other localities or schedule a private site visit.";
  }
}

export const openaiService = new OpenAIService();
