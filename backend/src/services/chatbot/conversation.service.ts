import { projectRepository } from '../../repositories/project.repository';
import { sessionRepository } from '../../repositories/session.repository';
import { messageRepository } from '../../repositories/message.repository';
import { retrievalService } from '../rag/retrieval.service';
import { propertyMatcherService, normalizeLocality } from '../rag/propertyMatcher.service';
import { openaiService } from '../ai/openai.service';
import { locationService } from '../location/location.service';
import { leadService } from '../leads/lead.service';
import { analyticsService } from '../analytics/analytics.service';
import { GROUNDED_CHATBOT_SYSTEM_PROMPT, MARKETING_AGENCY_SYSTEM_PROMPT } from '../../prompts';
import { localityDiscoveryService } from '../crawler/localityDiscovery.service';
import { logger } from '../../utils/logger';
import { OFFICIAL_PRYCOONS_CONTACT } from '../../config/organization';
import { visitService } from '../visits/visit.service';
import {
  ChatSessionMetadata,
  ChatResponsePayload,
  PropertyCardData,
} from '../../types';


export type MessageIntent =
  | 'GREETING'
  | 'CONVERSATION'
  | 'PROPERTY_INFORMATION'
  | 'PROPERTY_SEARCH'
  | 'PROPERTY_SEARCH_MORE'
  | 'CLARIFICATION'
  | 'GENERAL_REAL_ESTATE'
  | 'OUT_OF_SCOPE';

export class ConversationService {
  /**
   * Process an incoming user message and generate a grounded, source-aware response
   */
  async processMessage(params: {
    projectId: string;
    sessionId?: string;
    message: string;
    visitorId?: string;
    clientContext?: any;
    headers?: Record<string, string | string[] | undefined>;
  }): Promise<ChatResponsePayload> {
    const { projectId, message } = params;
    const userText = message.trim();
    const textLower = userText.toLowerCase();
    const startTime = Date.now();
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const isLocationShared = textLower.startsWith('location_shared:') || textLower.includes('shared location:');

    // 1. Concurrently kick off Project fetch and Session resolution in parallel
    const projectPromise = (async () => {
      return (await projectRepository.findById(projectId)) || (await projectRepository.findBySlug(projectId));
    })();

    const sessionPromise = (async () => {
      let s = params.sessionId ? await sessionRepository.getSessionById(params.sessionId) : null;
      if (!s) {
        s = await sessionRepository.createSession({
          id: params.sessionId,
          projectId,
          visitorId: params.visitorId,
          sessionMetadata: {
            state: 'GREETING',
            stepIndex: 0,
            discovery: {},
            lead: {},
            displayedPropertyTitles: [],
            displayedProperties: [],
            explicitSearchRequested: false,
          },
        });
      }
      return s;
    })();

    const [project, session] = await Promise.all([projectPromise, sessionPromise]);
    const projectName = project?.name || 'BRIM Real Estate Assistant';
    const industry = project?.industry || 'real-estate';
    const websiteUrl = project?.websiteUrl || 'https://prycoons.com/';

    const sessionId = session.id;
    let metadata: ChatSessionMetadata = session.sessionMetadata || {
      state: 'GREETING',
      stepIndex: 0,
      discovery: {},
      lead: {},
      displayedPropertyTitles: [],
      displayedProperties: [],
      explicitSearchRequested: false,
    };

    // Ensure discovery, lead, and tracking sub-objects exist
    metadata.discovery = metadata.discovery || {};
    metadata.lead = metadata.lead || {};
    metadata.engagement = metadata.engagement || {};
    metadata.displayedPropertyTitles = metadata.displayedPropertyTitles || [];
    metadata.displayedProperties = metadata.displayedProperties || [];

    // 2. Save incoming user message to DB in parallel
    const saveUserMessagePromise = messageRepository.createMessage({
      sessionId,
      role: 'USER',
      content: userText,
    });
    analyticsService
      .trackEvent({
        projectId,
        sessionId,
        eventType: 'message_sent',
      })
      .catch((err: any) => logger.warn(`Analytics trackEvent error: ${err.message}`));

    // 3. Extract Entities & Update Structured Conversation Memory
    this.extractAndStoreMemory(userText, metadata);

    // 4. Environmental Context & Client Context
    if (params.clientContext?.location) {
      metadata.userLocation = params.clientContext.location;
      if (!metadata.discovery.location) metadata.discovery.location = params.clientContext.location;
    }
    if (params.clientContext?.coordinates) {
      metadata.userCoordinates = params.clientContext.coordinates;
    }
    if (params.clientContext?.locationDenied) {
      metadata.locationDenied = true;
    }

    const locationCtx = locationService.getLocationFromRequest(params.headers);
    const clientTimeZone = params.clientContext?.timeZone || 'Asia/Kolkata';
    const timeCtx = locationService.getTimeContext({
      timeZone: clientTimeZone,
    });

    // 5. Geographic Scope Check: Strictly enforce Ahmedabad-only support
    const geoScope = localityDiscoveryService.isOutsideAhmedabad(userText);
    if (geoScope.isOutside) {
      const responseText = "I’m currently helping with properties in Ahmedabad only. 😊 Would you like me to find properties in Ahmedabad instead?";
      const quickReplies = ['Explore Ahmedabad 🏡', 'Properties in Gota', 'Properties in Bodakdev'];

      await saveUserMessagePromise;
      metadata.stepIndex += 1;

      await Promise.all([
        messageRepository.createMessage({
          sessionId,
          role: 'ASSISTANT',
          content: responseText,
          metadata: {
            sources: [],
            propertyCard: null,
            propertyCards: [],
            outsideGeographicScope: true,
            requestedCity: geoScope.city,
          },
        }),
        sessionRepository.updateSession(sessionId, {
          userName: metadata.userName,
          intent: metadata.intent,
          location: metadata.discovery.location,
          sessionMetadata: metadata,
        }),
      ]);

      return {
        sessionId,
        message: responseText,
        context: metadata,
        sources: [],
        suggestions: quickReplies,
        propertyCard: null,
        propertyCards: [],
        leadCaptureRequired: false,
        advisorConnected: false,
      };
    }

    // Authoritative Official Contact Information Check (Feature 3)
    const isEmailQuestion = /(?:what\s+(?:is|are)|what's|give\s+me|share|know|tell\s+me).*(?:email|mail|e-mail)/i.test(userText) ||
                           /^(?:prycoons?\s+)?(?:email|mail|e-mail)(?:\s+address|\s+id)?\??$/i.test(userText) ||
                           /(?:prycoons?|official)\s+(?:email|mail)/i.test(userText);
    const isPhoneQuestion = /(?:what\s+(?:is|are)|what's|give\s+me|share|know|tell\s+me).*(?:phone|number|mobile|contact\s+number|calling|call)/i.test(userText) ||
                           /^(?:official\s+)?(?:phone|mobile|contact)(?:\s+number)?\??$/i.test(userText) ||
                           /(?:prycoons?|official)\s+(?:phone|mobile|contact\s+number)/i.test(userText);
    const isGeneralContactQuestion = /(?:how\s+(?:can|do)\s+i\s+contact|contact\s+prycoons|reach\s+prycoons|connect\s+with\s+prycoons|speak\s+to\s+someone|speak\s+with\s+(?:an?\s+)?advisor|talk\s+to\s+(?:an?\s+)?advisor|contact\s+details|contact\s+info)/i.test(userText);

    if (isEmailQuestion || isPhoneQuestion || isGeneralContactQuestion) {
      let contactReply = '';
      if (isEmailQuestion && !isPhoneQuestion) {
        contactReply = `You can reach Prycoons via our official email at **${OFFICIAL_PRYCOONS_CONTACT.email}**.\n\nOur team typically responds within 2 business hours. Would you like me to help you schedule a site visit or explore properties in Ahmedabad?`;
      } else if (isPhoneQuestion && !isEmailQuestion) {
        contactReply = `The official contact number for Prycoons is **${OFFICIAL_PRYCOONS_CONTACT.phone}**.\n\nYou can call us directly for property inquiries, site visits, and consultation.`;
      } else {
        contactReply = `Here are the official contact details for Prycoons:\n\n• **Email:** ${OFFICIAL_PRYCOONS_CONTACT.email}\n• **Phone:** ${OFFICIAL_PRYCOONS_CONTACT.phone}\n• **Website:** ${OFFICIAL_PRYCOONS_CONTACT.websiteUrl}\n\nFeel free to call us directly, or let me know if you would like to schedule a private site visit for any property!`;
      }

      await saveUserMessagePromise;
      metadata.stepIndex += 1;

      await Promise.all([
        messageRepository.createMessage({
          sessionId,
          role: 'ASSISTANT',
          content: contactReply,
          metadata: {
            sources: [{ title: 'Official Prycoons Contact Information', url: OFFICIAL_PRYCOONS_CONTACT.websiteUrl }],
            isOfficialContact: true,
          },
        }),
        sessionRepository.updateSession(sessionId, {
          userName: metadata.userName,
          intent: 'company_contact',
          sessionMetadata: metadata,
        }),
      ]);

      return {
        sessionId,
        message: contactReply,
        context: metadata,
        sources: [{ title: 'Official Prycoons Contact Information', url: OFFICIAL_PRYCOONS_CONTACT.websiteUrl }],
        suggestions: ['Schedule a Visit 📅', 'Explore 3 BHK in Ambli', 'Browse Science City Homes'],
        propertyCard: null,
        propertyCards: [],
        leadCaptureRequired: false,
        advisorConnected: true,
      };
    }

    // Fetch recent messages for session context
    const recentDbMessages = await messageRepository.getRecentMessagesBySessionId(sessionId, 6);
    const historySummary = recentDbMessages
      .map((m: any) => `${m.role === 'USER' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    // 6. LLM-First Intent & Context Interpretation:
    const interpretation = await openaiService.interpretMessage({
      userMessage: userText,
      conversationHistorySummary: historySummary,
      currentUserState: {
        userName: metadata.userName,
        intent: metadata.intent,
        location: metadata.discovery.location,
        bhk: metadata.discovery.bhk || metadata.discovery.homeType,
        budget: metadata.discovery.budget,
        pendingQuestion: metadata.state,
        displayedPropertyTitles: metadata.displayedPropertyTitles,
      },
    });

    logger.info(`Message: "${userText}" -> LLM Interpretation: ${JSON.stringify(interpretation)}`);

    // Synchronize extracted entities into session metadata
    if (interpretation.extractedCriteria?.name && !metadata.userName) {
      metadata.userName = interpretation.extractedCriteria.name;
      metadata.lead.name = interpretation.extractedCriteria.name;
    }
    if (interpretation.extractedCriteria?.name && !metadata.userName) {
      metadata.userName = interpretation.extractedCriteria.name;
      metadata.lead.name = interpretation.extractedCriteria.name;
    }
    if (interpretation.extractedCriteria?.phone && !metadata.lead.phone) {
      metadata.lead.phone = interpretation.extractedCriteria.phone;
    }
    if (interpretation.extractedCriteria?.email && !metadata.lead.email) {
      metadata.lead.email = interpretation.extractedCriteria.email;
    }
    if (interpretation.extractedCriteria?.location) {
      const locLow = interpretation.extractedCriteria.location.toLowerCase().trim();
      const nonLocationWords = [
        'buy', 'rent', 'buying', 'renting', 'explore',
        'garden', 'a garden', 'park', 'greenery', 'balcony', 'gym', 'pool', 'swimming pool', 'clubhouse',
        'school', 'hospital', 'temple', 'metro', 'highway', 'lake', 'terrace'
      ];
      const isFeatureOrStop = nonLocationWords.some((w) => locLow === w || locLow.includes('garden') || locLow.includes('park') || locLow.includes('balcony'));
      if (!isFeatureOrStop) {
        const norm = normalizeLocality(interpretation.extractedCriteria.location);
        if (norm && norm.toLowerCase() !== 'ahmedabad') {
          if (metadata.discovery.location !== norm) {
            metadata.discovery.location = norm;
            metadata.displayedPropertyTitles = [];
            metadata.displayedProperties = [];
          }
        }
      } else if (locLow.includes('garden') || locLow.includes('park')) {
        metadata.discovery.mustHave = 'Landscaped Garden & Greenery';
        metadata.discovery.nearbyPreference = 'garden';
      }
    }
    if (interpretation.extractedCriteria?.bhk) {
      metadata.discovery.bhk = interpretation.extractedCriteria.bhk;
      if (!metadata.discovery.homeType) metadata.discovery.homeType = interpretation.extractedCriteria.bhk;
    }
    if (interpretation.extractedCriteria?.budgetNum) {
      metadata.discovery.budgetNum = interpretation.extractedCriteria.budgetNum;
      metadata.discovery.budgetMax = interpretation.extractedCriteria.budgetNum;
      if (interpretation.extractedCriteria.budget) {
        metadata.discovery.budget = interpretation.extractedCriteria.budget;
      }
    } else if (interpretation.extractedCriteria?.relaxBudget) {
      metadata.discovery.budgetNum = undefined;
      metadata.discovery.budget = undefined;
      metadata.discovery.budgetMax = undefined;
      metadata.discovery.rentMonthly = undefined;
    }
    if (interpretation.extractedCriteria?.intent) {
      metadata.intent = interpretation.extractedCriteria.intent;
    }
    if (interpretation.extractedCriteria?.mustHave) {
      metadata.discovery.mustHave = interpretation.extractedCriteria.mustHave;
    }

    // Check if user is answering the greeting name-collection prompt
    const hasPropertySearchWords = /(bhk|flat|apartment|propert|villa|crore|lakh|science city|gota|sola|bodakdev)/i.test(userText);
    const hasNameSignal =
      Boolean(interpretation.extractedCriteria?.name) ||
      /(?:you can call me|i am|i'm|my name is|this is|call me)\s+[a-zA-Z]+/i.test(userText);
    const isAnsweringGreeting =
      (metadata.state === 'GREETING' || (!metadata.userName && metadata.stepIndex <= 1)) &&
      (hasNameSignal || (userText.trim().split(/\s+/).length <= 3 && !hasPropertySearchWords && !userText.toLowerCase().includes('buy') && !userText.toLowerCase().includes('rent')));

    const isBrochureRequest = /(brochure|download|pdf|catalogue|specifications)/i.test(userText);

    // Determine effective intent: LLM-first with fallback
    let intent: MessageIntent = 'CONVERSATION';
    if (interpretation.intent === 'LEAD_CAPTURE' || Boolean(interpretation.extractedCriteria?.phone)) {
      intent = 'CONVERSATION';
    } else if (isBrochureRequest) {
      intent = 'CONVERSATION';
    } else if (interpretation.intent === 'OUT_OF_SCOPE') {
      intent = 'OUT_OF_SCOPE';
    } else if (interpretation.intent === 'GENERAL_QUESTION') {
      intent = 'GENERAL_REAL_ESTATE';
    } else if (interpretation.intent === 'PROPERTY_SEARCH') {
      intent = 'PROPERTY_SEARCH';
    } else if (interpretation.intent === 'PROPERTY_SEARCH_MORE') {
      intent = 'PROPERTY_SEARCH_MORE';
    } else if (interpretation.intent === 'PROPERTY_DETAILS') {
      intent = 'PROPERTY_INFORMATION';
    } else if (interpretation.intent === 'GREETING' || isAnsweringGreeting) {
      intent = 'GREETING';
    } else if (interpretation.intent === 'FLOW_ANSWER') {
      if (isAnsweringGreeting) {
        intent = 'GREETING';
      } else {
        intent = 'CLARIFICATION';
      }
    } else {
      intent = this.classifyIntent(userText, metadata);
    }

    // Mark explicit search if user made a direct search request
    if (intent === 'PROPERTY_SEARCH') {
      metadata.explicitSearchRequested = true;
      metadata.lastSearchQuery = userText;
    }

    let responseText = '';
    let quickReplies: string[] = [];
    let propertyCard: PropertyCardData | null = null;
    let propertyCards: PropertyCardData[] = [];
    let retrievedChunks: any[] = [];
    let formattedContext = '';
    let leadCaptureRequired = false;
    let advisorConnected = false;

    // ──────────────────────────────────────────────────────────────────────────
    // CASE A: User explicitly shared browser geolocation
    // ──────────────────────────────────────────────────────────────────────────
    if (isLocationShared) {
      const locClean = userText.replace(/location_shared:|shared location:/i, '').trim();
      if (locClean) {
        metadata.userLocation = locClean;
        metadata.discovery.location = locClean;
      }
      const place = metadata.userLocation || 'your area';
      responseText = `Thanks! I've noted your location as **${place}** 📍.\n\nAre you looking for properties near ${place}, or exploring a different area in Ahmedabad?`;
      quickReplies = [`Near ${place} 🏡`, 'Explore Gota / Science City', 'Thinking of Renting 🔑'];
      metadata.state = 'DISCOVERY_LOCATION';
    }

    // ──────────────────────────────────────────────────────────────────────────
    // CASE B: OUT OF SCOPE (Movies, Coding, Sports, Cooking, Trivia, etc.)
    // ──────────────────────────────────────────────────────────────────────────
    else if (intent === 'OUT_OF_SCOPE') {
      const aiPrompt = `You are BRIM Real Estate Assistant, helping users explore properties and real estate in Ahmedabad.
The user asked an off-topic or unrelated question: "${userText}".
Acknowledge or politely and briefly address the question (under 35 words), and warmly guide the conversation back to exploring homes, flats, or commercial real estate in Ahmedabad.
Keep the tone helpful, professional, friendly, and concise. Do NOT invent property listings or specific prices in this response.`;

      const aiResult = await openaiService.generateResponse(aiPrompt, userText, '');
      responseText = aiResult.text.replace(/\*{3,}/g, '**').trim();
      quickReplies = ['Explore properties in Ahmedabad 🏡', 'Looking to Buy', 'Thinking of Renting'];
      propertyCard = null;
      propertyCards = [];
    }

    // ──────────────────────────────────────────────────────────────────────────
    // CASE C: GENERAL REAL ESTATE QUESTION (Definitions, comparisons, area advice)
    // ──────────────────────────────────────────────────────────────────────────
    else if (intent === 'GENERAL_REAL_ESTATE') {
      const generalPrompt = `You are BRIM Real Estate Assistant, an expert property advisor representing Prycoons in Ahmedabad, Gujarat.
The user asked: "${userText}".
Answer this question authoritatively, warmly, and concisely (under 95 words).
- If the question is about an Ahmedabad area (like SG Highway, Bodakdev, Gota, Science City), provide authentic market perspective regarding infrastructure, connectivity, commercial expansion, appreciation potential, and lifestyle.
- If it's a comparison (such as buying vs renting, or ready-to-move vs under-construction), give a balanced, objective, and insightful explanation.
- If it's about RERA or risks, mention RERA registration, legal title checks, builder track record, and escrow protections.
- Do NOT invent specific property cards, arbitrary prices, or unverified claims.
- Do NOT force the user through a rigid questionnaire. Keep the conversation natural and welcoming.`;

      const aiResult = await openaiService.generateResponse(generalPrompt, userText, '');
      responseText = aiResult.text.replace(/\*{3,}/g, '**').trim();

      // If user had an active pending greeting or location flow, bridge smoothly without trapping them
      if (!metadata.userName && (metadata.state === 'GREETING' || metadata.state === 'INTENT_DETECTION')) {
        quickReplies = ['Explore properties in Ahmedabad 🏡', 'Looking to Buy', 'Thinking of Renting'];
      } else if (metadata.discovery.location) {
        responseText += `\n\nWould you like to see verified properties in **${metadata.discovery.location}**?`;
        quickReplies = [`Show properties in ${metadata.discovery.location} 🏡`, 'Explore other areas', 'Ask another question'];
      } else {
        quickReplies = ['Explore properties in Ahmedabad 🏡', 'Looking to Buy', 'Ask another question'];
      }

      propertyCard = null;
      propertyCards = [];
    }

    // ──────────────────────────────────────────────────────────────────────────
    // CASE D: GREETINGS & INTRODUCTIONS
    // ──────────────────────────────────────────────────────────────────────────
    else if (intent === 'GREETING') {
      if (metadata.userName) {
        responseText = `Nice to meet you, ${metadata.userName}! 👋 Are you looking to buy, rent, or just exploring?`;
        quickReplies = ['Looking to Buy 🏡', 'Thinking of Renting 🔑', 'Just Exploring ✨'];
        metadata.state = 'INTENT_DETECTION';
      } else {
        responseText = "Hi 👋 Welcome to BRIM Real Estate Assistant! I'm here to help you explore properties and find a home that suits your needs. What should I call you?";
        quickReplies = ['I am Rahul', 'Call me Rahul', 'Looking to explore'];
        metadata.state = 'GREETING';
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // CASE E: CONVERSATIONAL PREFERENCE COLLECTION (CLARIFICATION)
    // ──────────────────────────────────────────────────────────────────────────
    else if (intent === 'CLARIFICATION') {
      // 0. Explicit handling for Intent Selection ("Looking to Buy", "Thinking of Renting", "Just Exploring")
      const isBuyChoice = textLower.includes('looking to buy') || textLower === 'buy' || textLower === 'buying';
      const isRentChoice = textLower.includes('thinking of renting') || textLower.includes('looking to rent') || textLower === 'rent' || textLower === 'renting';
      const isExploreChoice = textLower.includes('just exploring') || textLower.includes('exploring') || textLower === 'explore';

      if ((metadata.state === 'INTENT_DETECTION' || isBuyChoice || isRentChoice || isExploreChoice) && !metadata.discovery.location && !metadata.discovery.bhk) {
        metadata.state = 'DISCOVERY_LOCATION';
        if (isRentChoice) {
          metadata.intent = 'rent';
          responseText = `Got it! Renting gives you fantastic flexibility 👍.\n\nWhich area in Ahmedabad are you considering?`;
        } else if (isExploreChoice) {
          metadata.intent = 'buy';
          responseText = `Wonderful! Exploring is the best way to discover exciting opportunities ✨.\n\nWhich area in Ahmedabad would you like to explore first?`;
        } else {
          metadata.intent = 'buy';
          responseText = `Exciting! Buying a home is a wonderful milestone 🏡.\n\nWhich area in Ahmedabad are you considering?`;
        }
        quickReplies = ['Gota', 'Science City / Sola', 'Tragad', 'Ambli / SG Highway', 'Bodakdev'];
        await saveUserMessagePromise;
        metadata.stepIndex += 1;
        await Promise.all([
          messageRepository.createMessage({
            sessionId,
            role: 'ASSISTANT',
            content: responseText,
            metadata: { sources: [], propertyCard: null, propertyCards: [] },
          }),
          sessionRepository.updateSession(sessionId, {
            userName: metadata.userName,
            intent: metadata.intent,
            location: metadata.discovery.location,
            sessionMetadata: metadata,
          }),
        ]);
        return {
          sessionId,
          message: responseText,
          context: metadata,
          sources: [],
          suggestions: quickReplies,
          quickReplies,
          propertyCard: null,
          propertyCards: [],
          leadCaptureRequired: false,
          advisorConnected: false,
        };
      }

      // Direct handling for Action Buttons: "Adjust budget" or "Explore nearby areas"
      if (textLower.includes('adjust budget') || textLower.includes('change budget') || textLower.includes('update budget')) {
        const targetLoc = metadata.discovery.location || 'Science City';
        responseText = `What budget range would you like to set for properties in **${targetLoc}**? In ${targetLoc}, premium 3 & 4 BHK residences typically range from ₹1.65 Cr to ₹3.10 Cr.`;
        quickReplies = ['Under ₹1.75 Cr', '₹1.75 Cr – ₹2.50 Cr', 'Above ₹2.50 Cr', 'Explore Gota (Under ₹1 Cr)'];
        metadata.state = 'DISCOVERY_BUDGET';
        await saveUserMessagePromise;
        metadata.stepIndex += 1;
        await Promise.all([
          messageRepository.createMessage({
            sessionId,
            role: 'ASSISTANT',
            content: responseText,
            metadata: { sources: [], propertyCard: null, propertyCards: [] },
          }),
          sessionRepository.updateSession(sessionId, {
            userName: metadata.userName,
            intent: metadata.intent,
            location: metadata.discovery.location,
            sessionMetadata: metadata,
          }),
        ]);
        return {
          sessionId,
          message: responseText,
          context: metadata,
          sources: [],
          suggestions: quickReplies,
          quickReplies,
          propertyCard: null,
          propertyCards: [],
          leadCaptureRequired: false,
          advisorConnected: false,
        };
      }

      if (textLower.includes('explore nearby') || textLower.includes('nearby areas') || textLower.includes('nearby localities')) {
        responseText = `Nearby areas in Ahmedabad with verified properties in various price brackets include **Gota** (from ₹52 Lakh), **Sola** (from ₹1.15 Cr), and **Chandkheda** (from ₹45 Lakh). Which area would you like to explore?`;
        quickReplies = ['Properties in Gota 🏡', 'Properties in Sola', 'Properties in Chandkheda'];
        metadata.state = 'DISCOVERY_LOCATION';
        await saveUserMessagePromise;
        metadata.stepIndex += 1;
        await Promise.all([
          messageRepository.createMessage({
            sessionId,
            role: 'ASSISTANT',
            content: responseText,
            metadata: { sources: [], propertyCard: null, propertyCards: [] },
          }),
          sessionRepository.updateSession(sessionId, {
            userName: metadata.userName,
            intent: metadata.intent,
            location: metadata.discovery.location,
            sessionMetadata: metadata,
          }),
        ]);
        return {
          sessionId,
          message: responseText,
          context: metadata,
          sources: [],
          suggestions: quickReplies,
          quickReplies,
          propertyCard: null,
          propertyCards: [],
          leadCaptureRequired: false,
          advisorConnected: false,
        };
      }

      // If user was prompted to confirm search and agrees or wants to adjust
      if (metadata.state === 'DISCOVERY_CONFIRM_SEARCH') {
        if (textLower.includes('adjust') || textLower.includes('change')) {
          responseText = `Sure! Which area, configuration, or budget would you like to update?`;
          quickReplies = ['Change Location', 'Change Budget', 'Change BHK'];
          metadata.state = 'DISCOVERY_LOCATION';
          return {
            sessionId,
            message: responseText,
            context: metadata,
            sources: [],
            suggestions: quickReplies,
            quickReplies,
            propertyCard: null,
            propertyCards: [],
            leadCaptureRequired: false,
            advisorConnected: false,
          };
        } else if (
          textLower.includes('yes') ||
          textLower.includes('show') ||
          textLower.includes('sure') ||
          textLower.includes('please') ||
          textLower.includes('okay') ||
          textLower.includes('ok') ||
          textLower.includes('matching') ||
          textLower.includes('explore')
        ) {
          return this.executePropertySearch(params, metadata, project, sessionId, saveUserMessagePromise, false, requestId, startTime);
        }
      }

      // Dynamic Missing Criteria Evaluation:
      const hasLocation = Boolean(metadata.discovery.location);
      const hasBHK = Boolean(metadata.discovery.bhk || metadata.discovery.homeType);
      const hasBudget = Boolean(metadata.discovery.budget || metadata.discovery.budgetNum || metadata.discovery.rentMonthly);
      const loc = metadata.discovery.location || 'Ahmedabad';
      const bhk = metadata.discovery.bhk || (metadata.discovery.homeType?.includes('BHK') ? metadata.discovery.homeType.match(/\d\s*BHK/i)?.[0] : null) || metadata.discovery.homeType || '3 BHK';
      const budgetStr = metadata.discovery.budget || (metadata.discovery.rentMonthly ? `₹${metadata.discovery.rentMonthly.toLocaleString('en-IN')}/month` : 'your budget');
      const userIntent = metadata.intent || 'buy';

      // 1. All necessary criteria already provided
      if (hasLocation && hasBHK && hasBudget) {
        if (metadata.explicitSearchRequested) {
          return this.executePropertySearch(params, metadata, project, sessionId, saveUserMessagePromise, false, requestId, startTime);
        } else {
          metadata.state = 'DISCOVERY_CONFIRM_SEARCH';
          const rentTag = userIntent === 'rent' ? ' for rent' : '';
          responseText = `Got it! A **${bhk}**${rentTag} in **${loc}** within **${budgetStr}** 👍.\n\nWould you like me to show you verified matching properties?`;
          quickReplies = ['Yes, show matching properties 🏡', 'Adjust search criteria ⚙️'];
        }
      }
      // 2. Location & BHK provided, only budget is missing
      else if (hasLocation && hasBHK && !hasBudget) {
        metadata.state = 'DISCOVERY_BUDGET';
        if (userIntent === 'rent') {
          responseText = `Got it! You're looking to rent a **${bhk}** in **${loc}**. What's your approximate monthly budget?`;
          quickReplies = ['Under ₹25,000/mo', '₹25,000 – ₹40,000/mo', 'Above ₹40,000/mo'];
        } else {
          responseText = `Got it! You're looking to buy a **${bhk}** in **${loc}**. What's your approximate budget?`;
          quickReplies = ['Under ₹1 Crore', '₹1.00 Cr – ₹1.50 Cr', '₹1.50 Cr – ₹2.50 Cr'];
        }
      }
      // 3. BHK provided, location is missing
      else if (hasBHK && !hasLocation) {
        metadata.state = 'DISCOVERY_LOCATION';
        responseText = `Got it, a **${bhk}** 👍. Which area in Ahmedabad are you considering?`;
        quickReplies = ['Gota', 'Science City / Sola', 'Tragad', 'Ambli / SG Highway', 'Bodakdev'];
      }
      // 4. Location provided, BHK is missing
      else if (hasLocation && !hasBHK) {
        metadata.state = 'DISCOVERY_HOME_TYPE';
        responseText = `**${loc}** is a wonderful locality 👍. What configuration are you looking for?`;
        quickReplies = ['2 BHK', '3 BHK', '4 BHK Sky Villa'];
      }
      // 5. Neither location nor BHK known
      else {
        metadata.state = 'DISCOVERY_LOCATION';
        if (userIntent === 'rent') {
          responseText = `Got it! Renting gives you fantastic flexibility 👍.\n\nWhich area in Ahmedabad are you considering?`;
        } else {
          responseText = `Exciting! Buying a home is a wonderful milestone 🏡.\n\nWhich area in Ahmedabad are you considering?`;
        }
        quickReplies = ['Gota', 'Science City / Sola', 'Tragad', 'Ambli / SG Highway', 'Bodakdev'];
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // CASE F: EXPLICIT PROPERTY SEARCH (INITIAL OR SUBSEQUENT SEARCH)
    // ──────────────────────────────────────────────────────────────────────────
    else if (intent === 'PROPERTY_SEARCH') {
      return this.executePropertySearch(params, metadata, project, sessionId, saveUserMessagePromise, false, requestId, startTime);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // CASE G: USER REQUESTS MORE OPTIONS ("Show me more", "Other options")
    // ──────────────────────────────────────────────────────────────────────────
    else if (intent === 'PROPERTY_SEARCH_MORE') {
      return this.executePropertySearch(params, metadata, project, sessionId, saveUserMessagePromise, true, requestId, startTime);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // CASE H: INQUIRY ABOUT A SPECIFIC PROPERTY ("Tell me about Aahvan Greens", "Price of the second one")
    // ──────────────────────────────────────────────────────────────────────────
    else if (intent === 'PROPERTY_INFORMATION') {
      const targetProjectName = interpretation.extractedCriteria?.targetProjectName || this.extractTargetProject(userText);
      const resolvedRef = this.resolveReferencedProperty(userText, metadata);
      let referencedCard = resolvedRef?.property;
      if (!referencedCard && interpretation.referencedPropertyIndex !== undefined && metadata.displayedProperties) {
        referencedCard = metadata.displayedProperties[interpretation.referencedPropertyIndex] || null;
      }
      const attributeReq = interpretation.attributeRequested || resolvedRef.attributeRequested;
      const projectNameTarget = targetProjectName || referencedCard?.title;

      // Follow-up reference: specific property attribute queries
      if (referencedCard && attributeReq === 'price') {
        responseText = `The price for **${referencedCard.title}** in **${referencedCard.location}** is **${referencedCard.priceRange}**${referencedCard.bhk ? ` for ${referencedCard.bhk} residences` : ''}.\n\nWould you like more details on its floor plans, amenities, or to schedule a private visit?`;
        propertyCard = referencedCard;
        propertyCards = [referencedCard];
        metadata.lastViewedProperty = referencedCard;
        quickReplies = ['Show amenities', 'Download brochure 📥', 'Schedule site visit 📅'];
      } else if (referencedCard && attributeReq === 'amenities') {
        const amList = referencedCard.amenities && referencedCard.amenities.length > 0
          ? referencedCard.amenities.join(', ')
          : 'Landscaped Garden, Gymnasium, Clubhouse, 24/7 Security, Children Play Area';
        responseText = `**${referencedCard.title}** offers premium lifestyle amenities including: **${amList}**.\n\nWould you like to schedule a private tour or download the brochure?`;
        propertyCard = referencedCard;
        propertyCards = [referencedCard];
        metadata.lastViewedProperty = referencedCard;
        quickReplies = ['Check pricing', 'Download brochure 📥', 'Schedule site visit 📅'];
      } else if (referencedCard && attributeReq === 'location') {
        responseText = `**${referencedCard.title}** is located in **${referencedCard.location}**.\n\nWould you like to see available configurations, pricing, or arrange a site visit?`;
        propertyCard = referencedCard;
        propertyCards = [referencedCard];
        metadata.lastViewedProperty = referencedCard;
        quickReplies = ['Check pricing', 'Show amenities', 'Schedule site visit 📅'];
      } else {
        // Detailed inquiry for named project or general overview
        retrievedChunks = await retrievalService.hybridRetrieve(
          projectId,
          projectNameTarget || userText,
          params.clientContext,
          12
        );
        formattedContext = retrievalService.formatContextForPrompt(retrievedChunks);

        const matchRes = propertyMatcherService.matchProperties(retrievedChunks, {
          projectName: projectNameTarget,
        });

        // Find the specific matching card
        const specificCard = referencedCard || (projectNameTarget
          ? matchRes.allMatches.find((c) => c.title.toLowerCase().includes(projectNameTarget.toLowerCase()))
          : null) || matchRes.exactMatch;

        propertyCard = specificCard || null;
        propertyCards = specificCard ? [specificCard] : [];
        if (specificCard) {
          metadata.lastViewedProperty = specificCard;
        }

        // Grounded OpenAI generation for this specific property
        const knownContextSummary = this.buildKnownContextSummary(metadata);
        const basePrompt = industry === 'marketing' ? MARKETING_AGENCY_SYSTEM_PROMPT : GROUNDED_CHATBOT_SYSTEM_PROMPT;
        const populatedSystemPrompt = basePrompt
          .replace(/{{projectName}}/g, projectName)
          .replace(/{{industryName}}/g, project?.industryName || 'Real Estate')
          .replace(/{{websiteUrl}}/g, websiteUrl)
          .replace(/{{userLocation}}/g, metadata.userLocation || locationCtx.city)
          .replace(/{{timeGreeting}}/g, timeCtx.greeting)
          .replace(/{{knownContextSummary}}/g, knownContextSummary || 'None so far')
          .replace(/{{retrievedContext}}/g, formattedContext)
          .replace(/{{userName}}/g, metadata.userName || 'Visitor')
          .replace(/{{userIntent}}/g, metadata.intent || 'Buying / Inquiring')
          .replace(/{{targetLocation}}/g, metadata.discovery.location || 'Not specified')
          .replace(/{{targetHomeType}}/g, metadata.discovery.homeType || 'Not specified')
          .replace(/{{targetBudget}}/g, metadata.discovery.budget || 'Not specified')
          .replace(/{{lifestyleMustHaves}}/g, metadata.discovery.mustHave || 'Not specified');

        const aiResult = await openaiService.generateResponse(
          populatedSystemPrompt,
          userText,
          formattedContext
        );

        responseText = aiResult.text
          .replace(/\[details not specified in the context\]/gi, '')
          .replace(/\[details not specified[^\]]*\]/gi, '')
          .replace(/\[not specified[^\]]*\]/gi, '')
          .replace(/\*{3,}/g, '**')
          .trim();

        if (specificCard && specificCard.sourceUrl && !responseText.includes(specificCard.sourceUrl)) {
          responseText += `\n\nExplore full project details: ${specificCard.sourceUrl}`;
        }

        quickReplies = ['Download brochure 📥', 'Schedule site visit 📅', 'Explore other options 🏡'];
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // CASE I: CONVERSATIONAL SMALL TALK / LEAD CAPTURE / THANK YOU
    // ──────────────────────────────────────────────────────────────────────────
    else {
      const isContactQuestion =
        /(what is (the )?(official )?(email|phone|contact|number)|how (can|do) i (contact|reach|call)|where can i find more information|can i speak to someone|talk to (an )?advisor|contact prycoons)/i.test(userText) ||
        (/\b(email|phone|number|contact|call|reach)\b/i.test(userText) && /\b(prycoons|office|support|helpline|official)\b/i.test(userText));

      if (isContactQuestion) {
        responseText = `You can reach Prycoons Real Estate directly through our official contact channels:\n\n• **Official Email:** [${OFFICIAL_PRYCOONS_CONTACT.email}](mailto:${OFFICIAL_PRYCOONS_CONTACT.email})\n• **Official Phone:** [${OFFICIAL_PRYCOONS_CONTACT.phone}](tel:${OFFICIAL_PRYCOONS_CONTACT.phone.replace(/\s+/g, '')})\n• **Official Website:** [${OFFICIAL_PRYCOONS_CONTACT.websiteUrl}](${OFFICIAL_PRYCOONS_CONTACT.websiteUrl})\n\nFeel free to call or email us for property inquiries, or let me know if you would like to schedule a private site visit!`;
        quickReplies = ['Schedule site visit 📅', 'Download brochure 📥', 'Explore properties in Ahmedabad 🏡'];
      } else if (textLower.includes('brochure') || textLower.includes('download')) {
        const targetProp = metadata.lastViewedProperty || (metadata.displayedProperties && metadata.displayedProperties[0]);
        const propTitle = targetProp?.title || (metadata.discovery.location ? `Prycoons Residences in ${metadata.discovery.location}` : 'Prycoons Ahmedabad Residences');
        const propLoc = targetProp?.location || metadata.discovery.location || 'Ahmedabad';
        const brochureDownloadUrl = `/api/brochures/download?title=${encodeURIComponent(propTitle)}&location=${encodeURIComponent(propLoc)}&price=${encodeURIComponent(targetProp?.priceRange || '')}&bhk=${encodeURIComponent(targetProp?.bhk || '')}&url=${encodeURIComponent(targetProp?.propertyDetailUrl || targetProp?.sourceUrl || '')}`;

        responseText = `Here is your official project brochure & specifications document for **${propTitle}** in **${propLoc}** 📄✨:\n\n📥 [**Download ${propTitle} Official Brochure (PDF)**](${brochureDownloadUrl})\n\nThis brochure includes master layout floor plans, carpet area dimensions, clubhouse & landscape amenity blueprints, and RERA compliance verification.`;
        quickReplies = ['Schedule site visit 📅', 'Check pricing', 'Explore more properties 🏡'];
        if (targetProp) {
          propertyCard = targetProp;
          propertyCards = [targetProp];
        }
      } else if (textLower.includes('whatsapp') || textLower.includes('shortlist')) {
        const targetProp = metadata.lastViewedProperty || (metadata.displayedProperties && metadata.displayedProperties[0]);
        const propTitle = targetProp?.title || 'Prycoons Ahmedabad Residences';
        const propLoc = targetProp?.location || metadata.discovery.location || 'Ahmedabad';
        const brochureDownloadUrl = `/api/brochures/download?title=${encodeURIComponent(propTitle)}&location=${encodeURIComponent(propLoc)}&price=${encodeURIComponent(targetProp?.priceRange || '')}&bhk=${encodeURIComponent(targetProp?.bhk || '')}&url=${encodeURIComponent(targetProp?.propertyDetailUrl || targetProp?.sourceUrl || '')}`;

        responseText = `You can directly download the official brochure for **${propTitle}** right here:\n\n📥 [**Download ${propTitle} Official Brochure (PDF)**](${brochureDownloadUrl})\n\nOur property team is also available for direct consultations at **${OFFICIAL_PRYCOONS_CONTACT.phone}** or via email at **${OFFICIAL_PRYCOONS_CONTACT.email}**.`;
        quickReplies = ['Download brochure 📥', 'Schedule site visit 📅', 'Explore other options 🏡'];
      } else if (
        textLower.includes('advisor') ||
        textLower.includes('call') ||
        textLower.includes('tour') ||
        textLower.includes('schedule') ||
        textLower.includes('visit')
      ) {
        const targetProp = metadata.lastViewedProperty || (metadata.displayedProperties && metadata.displayedProperties[0]);
        const propTitle = targetProp?.title || (metadata.discovery.location ? `Prycoons Residences in ${metadata.discovery.location}` : 'Prycoons Ahmedabad Residences');

        if (metadata.lead.phone && (metadata.lead.name || metadata.userName)) {
          // Persist the visit request in database
          try {
            await visitService.createVisitRequest({
              projectId,
              sessionId,
              customerName: metadata.lead.name || metadata.userName || 'Website Visitor',
              mobileNumber: metadata.lead.phone,
              email: metadata.lead.email || null,
              propertyName: targetProp?.title || 'Unspecified',
              propertyUrl: targetProp?.propertyDetailUrl || targetProp?.sourceUrl || null,
              locality: targetProp?.location || metadata.discovery.location || null,
              city: 'Ahmedabad',
              bhk: targetProp?.bhk || metadata.discovery.bhk || null,
              propertyPrice: targetProp?.priceRange || null,
              assistantId: projectId,
              assistantName: projectName,
              customerNotes: 'Visit scheduled via conversational request',
              preferredDate: 'Saturday 11:00 AM',
            });
          } catch (e: any) {
            logger.warn(`Could not save visit request in flow: ${e.message}`);
          }

          advisorConnected = true;
          metadata.engagement.advisorConnected = true;
          responseText = `🎉 Thank you, **${metadata.lead.name || metadata.userName}**! We have recorded your visit request for **${propTitle}**.\n\nOur property team will contact you on **${metadata.lead.phone}** to finalize your preferred time slot and share visitor directions.`;
          quickReplies = ['Explore another project', 'Download brochure 📥', 'Restart conversation 🔄'];
          metadata.state = 'COMPLETED';
        } else {
          leadCaptureRequired = true;
          responseText = `I would be delighted to help arrange a site visit for **${propTitle}**! 📅\n\nCould you please share your name and mobile number so our property team can coordinate your visit?`;
          quickReplies = ['Share contact details', 'Download brochure 📥', 'Explore more properties 🏡'];
        }
      } else {
        responseText = `You're very welcome! Let me know whenever you would like to explore properties or learn more about our projects in Ahmedabad.`;
        quickReplies = ['Explore properties in Ahmedabad 🏡', 'Looking to Buy', 'Thinking of Renting'];
      }
    }

    // 10. Auto-capture lead if phone info was provided
    if (metadata.lead.phone && !metadata.lead.captured) {
      metadata.lead.captured = true;
      leadCaptureRequired = true;
      await leadService.captureLead({
        projectId,
        sessionId,
        name: metadata.lead.name || metadata.userName || 'Website Visitor',
        phone: metadata.lead.phone,
        email: metadata.lead.email || null,
        intent: metadata.intent || 'buying',
        preferences: metadata.discovery,
        source: 'chatbot',
      });

      // If user had requested a visit or consultation, persist the visit request
      if (
        metadata.engagement.advisorConnected ||
        textLower.includes('visit') ||
        textLower.includes('tour') ||
        textLower.includes('schedule')
      ) {
        const targetProp = metadata.lastViewedProperty || (metadata.displayedProperties && metadata.displayedProperties[0]);
        try {
          await visitService.createVisitRequest({
            projectId,
            sessionId,
            customerName: metadata.lead.name || metadata.userName || 'Website Visitor',
            mobileNumber: metadata.lead.phone,
            email: metadata.lead.email || null,
            propertyName: targetProp?.title || 'Unspecified',
            propertyUrl: targetProp?.propertyDetailUrl || targetProp?.sourceUrl || null,
            locality: targetProp?.location || metadata.discovery.location || null,
            city: 'Ahmedabad',
            bhk: targetProp?.bhk || metadata.discovery.bhk || null,
            propertyPrice: targetProp?.priceRange || null,
            assistantId: projectId,
            assistantName: projectName,
            customerNotes: 'Visit request from conversational phone capture',
            preferredDate: 'Saturday 11:00 AM',
          });
        } catch (e: any) {
          logger.warn(`Could not save auto-captured visit request: ${e.message}`);
        }
      }
    }

    // 11. Ensure incoming user message is saved to DB before recording assistant response
    await saveUserMessagePromise;

    metadata.stepIndex += 1;
    await Promise.all([
      messageRepository.createMessage({
        sessionId,
        role: 'ASSISTANT',
        content: responseText,
        metadata: {
          sources: retrievedChunks.map((c) => ({
            title: c.sourceTitle,
            url: c.sourceUrl,
            relevance: c.score,
          })),
          propertyCard,
          propertyCards,
        },
      }),
      sessionRepository.updateSession(sessionId, {
        userName: metadata.userName,
        intent: metadata.intent,
        location: metadata.discovery.location,
        sessionMetadata: metadata,
      }),
    ]);

    const sources = retrievedChunks.map((c) => ({
      title: c.sourceTitle,
      url: c.sourceUrl,
      relevance: parseFloat((c.score || 0.9).toFixed(2)),
      snippet: (c.content || '').slice(0, 160) + '...',
    }));

    this.logDiagnostic({
      requestId,
      assistantId: projectId,
      conversationId: sessionId,
      openaiStatus: intent === 'OUT_OF_SCOPE' || intent === 'GENERAL_REAL_ESTATE' || intent === 'PROPERTY_INFORMATION' ? 'INVOKED' : 'SKIPPED',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      intent,
      criteria: metadata.discovery,
      retrievalRequired: intent === 'PROPERTY_INFORMATION',
      retrievalStatus: intent === 'PROPERTY_INFORMATION' ? (propertyCards.length > 0 ? 'SUCCESS_WITH_RESULTS' : 'SUCCESS_WITH_NO_MATCHES') : 'NOT_REQUIRED',
      candidateCount: retrievedChunks.length,
      finalResultCount: propertyCards.length,
      durationMs: Date.now() - startTime,
    });

    return {
      sessionId,
      message: responseText,
      context: metadata,
      sources,
      suggestions: quickReplies,
      quickReplies,
      propertyCard,
      propertyCards,
      leadCaptureRequired,
      advisorConnected,
    };
  }

  /**
   * Helper to execute property search and enforce the 3-property limit and pagination
   */
  private async executePropertySearch(
    params: any,
    metadata: ChatSessionMetadata,
    project: any,
    sessionId: string,
    saveUserMessagePromise: Promise<any>,
    isMoreRequest: boolean,
    requestId?: string,
    startTime?: number
  ): Promise<ChatResponsePayload> {
    const { projectId, message } = params;
    const userText = message.trim();
    const projectName = project?.name || 'BRIM Real Estate Assistant';
    const industry = project?.industry || 'real-estate';
    const websiteUrl = project?.websiteUrl || 'https://prycoons.com/';

    metadata.state = 'PROPERTY_SEARCH';

    const tl = userText.toLowerCase();
    const isRelaxBudgetAction =
      tl.includes('explore other') ||
      tl.includes('other properties') ||
      tl.includes('explore all') ||
      tl.includes('all properties') ||
      tl.includes('without budget') ||
      tl.includes('no budget');

    if (isRelaxBudgetAction) {
      metadata.discovery.budgetNum = undefined;
      metadata.discovery.budget = undefined;
      metadata.discovery.budgetMax = undefined;
      metadata.discovery.rentMonthly = undefined;
    }

    const targetLoc = normalizeLocality(metadata.discovery.location);
    const locationQuery = targetLoc || metadata.discovery.location || 'Ahmedabad';
    const bhkQuery = metadata.discovery.homeType || metadata.discovery.bhk || '';

    // Dynamic Locality Discovery & Real-Time Ingestion:
    // If user requested a specific locality in Ahmedabad, ensure it is discovered from Prycoons
    if (targetLoc && targetLoc.toLowerCase() !== 'ahmedabad') {
      const discoveryResult = await localityDiscoveryService.discoverAndIndexLocality(targetLoc, projectId);

      if (discoveryResult.status === 'NETWORK_ERROR') {
        const networkMsg = "I'm having trouble connecting to the property listings right now. Please check your connection and try again in a moment.";
        const quickReplies = ['Try again 🔄', 'Explore other localities', 'Talk to advisor 📞'];
        await saveUserMessagePromise;
        metadata.stepIndex += 1;
        await Promise.all([
          messageRepository.createMessage({
            sessionId,
            role: 'ASSISTANT',
            content: networkMsg,
            metadata: { sources: [], propertyCard: null, propertyCards: [] },
          }),
          sessionRepository.updateSession(sessionId, {
            userName: metadata.userName,
            intent: metadata.intent,
            location: metadata.discovery.location,
            sessionMetadata: metadata,
          }),
        ]);
        return {
          sessionId,
          message: networkMsg,
          context: metadata,
          sources: [],
          suggestions: quickReplies,
          propertyCard: null,
          propertyCards: [],
          leadCaptureRequired: false,
          advisorConnected: false,
        };
      }

      if (discoveryResult.status === 'NOT_FOUND' || discoveryResult.status === 'EMPTY_PAGE') {
        const noResultsMsg = `I couldn’t find any matching properties in **${targetLoc}** on Prycoons right now. Would you like me to check another Ahmedabad area, such as Gota, Bodakdev, or Thaltej?`;
        const quickReplies = ['Explore Gota 🏡', 'Explore Bodakdev', 'Explore Thaltej'];
        await saveUserMessagePromise;
        metadata.stepIndex += 1;
        await Promise.all([
          messageRepository.createMessage({
            sessionId,
            role: 'ASSISTANT',
            content: noResultsMsg,
            metadata: { sources: [], propertyCard: null, propertyCards: [] },
          }),
          sessionRepository.updateSession(sessionId, {
            userName: metadata.userName,
            intent: metadata.intent,
            location: metadata.discovery.location,
            sessionMetadata: metadata,
          }),
        ]);
        return {
          sessionId,
          message: noResultsMsg,
          context: metadata,
          sources: [],
          suggestions: quickReplies,
          propertyCard: null,
          propertyCards: [],
          leadCaptureRequired: false,
          advisorConnected: false,
        };
      }
    }

    const searchQuery = isMoreRequest
      ? `${locationQuery} ${bhkQuery} residential properties`
      : userText.toLowerCase().includes(locationQuery.toLowerCase())
        ? userText
        : `${userText} in ${locationQuery}`;

    const retrievedChunks = await retrievalService.hybridRetrieve(
      projectId,
      searchQuery,
      {
        ...params.clientContext,
        discovery: {
          ...metadata.discovery,
          location: locationQuery,
        },
      },
      15
    );
    const formattedContext = retrievalService.formatContextForPrompt(retrievedChunks);

    const propertyMatch = propertyMatcherService.matchProperties(retrievedChunks, {
      location: locationQuery,
      propertyType: metadata.discovery.homeType || metadata.discovery.bhk,
      budgetNum: metadata.discovery.budgetNum,
      mustHave: metadata.discovery.mustHave,
    });

    const allMatches = propertyMatch.allMatches || [];
    let displayedTitles = metadata.displayedPropertyTitles || [];

    let chosenCards: PropertyCardData[] = [];
    let responseText = '';

    if (isMoreRequest) {
      // Exclude properties already shown in this search session
      const remainingMatches = allMatches.filter(
        (c) => !displayedTitles.some((t) => t.toLowerCase() === c.title.toLowerCase())
      );

      if (remainingMatches.length > 0) {
        // Return next 3 properties
        chosenCards = remainingMatches.slice(0, 3);
        chosenCards.forEach((c) => displayedTitles.push(c.title));
        metadata.displayedPropertyTitles = displayedTitles;
        metadata.displayedProperties = chosenCards;
        if (chosenCards[0]) {
          metadata.lastViewedProperty = chosenCards[0];
        }

        responseText = `Here are **${chosenCards.length} more verified properties** matching your requirements in **${locationQuery}**:`;
      } else {
        // No more remaining matches
        chosenCards = [];
        responseText = `You've seen all currently available verified listings matching these criteria in **${locationQuery}**. Would you like to explore nearby areas or adjust your budget range?`;
      }
    } else {
      // New search: reset displayed titles, pick top 3 distinct properties
      displayedTitles = [];
      chosenCards = allMatches.slice(0, 3);
      chosenCards.forEach((c) => displayedTitles.push(c.title));
      metadata.displayedPropertyTitles = displayedTitles;
      metadata.displayedProperties = chosenCards;
      if (chosenCards[0]) {
        metadata.lastViewedProperty = chosenCards[0];
      }

      if (chosenCards.length > 0) {
        const topMatchesSummary = chosenCards.map((c) => `**${c.title}** (${c.priceRange})`).join(', ');
        const locationCtx = locationService.getLocationFromRequest(params.headers);
        const clientTimeZone = params.clientContext?.timeZone || 'Asia/Kolkata';
        const timeCtx = locationService.getTimeContext({ timeZone: clientTimeZone });

        const knownContextSummary = this.buildKnownContextSummary(metadata);
        const basePrompt = industry === 'marketing' ? MARKETING_AGENCY_SYSTEM_PROMPT : GROUNDED_CHATBOT_SYSTEM_PROMPT;
        const populatedSystemPrompt = basePrompt
          .replace(/{{projectName}}/g, projectName)
          .replace(/{{industryName}}/g, project?.industryName || 'Real Estate')
          .replace(/{{websiteUrl}}/g, websiteUrl)
          .replace(/{{userLocation}}/g, metadata.userLocation || locationCtx.city)
          .replace(/{{timeGreeting}}/g, timeCtx.greeting)
          .replace(/{{knownContextSummary}}/g, knownContextSummary || 'None so far')
          .replace(/{{retrievedContext}}/g, formattedContext)
          .replace(/{{userName}}/g, metadata.userName || 'Visitor')
          .replace(/{{userIntent}}/g, metadata.intent || 'Buying / Inquiring')
          .replace(/{{targetLocation}}/g, metadata.discovery.location || 'Not specified')
          .replace(/{{targetHomeType}}/g, metadata.discovery.homeType || 'Not specified')
          .replace(/{{targetBudget}}/g, metadata.discovery.budget || 'Not specified')
          .replace(/{{lifestyleMustHaves}}/g, metadata.discovery.mustHave || 'Not specified');

        const aiResult = await openaiService.generateResponse(
          populatedSystemPrompt,
          userText,
          formattedContext
        );

        responseText = aiResult.text
          .replace(/\[details not specified in the context\]/gi, 'Available upon inquiry')
          .replace(/\[details not specified[^\]]*\]/gi, 'Available upon inquiry')
          .replace(/\[not specified[^\]]*\]/gi, '')
          .replace(/\*{3,}/g, '**')
          .trim();
      } else {
        const withoutBudgetMatch = propertyMatcherService.matchProperties(retrievedChunks, {
          location: locationQuery,
          propertyType: metadata.discovery.homeType || metadata.discovery.bhk,
        });

        if (withoutBudgetMatch.allMatches.length > 0 && metadata.discovery.budgetNum) {
          const sampleNames = withoutBudgetMatch.allMatches.slice(0, 2).map((m) => m.title).join(' and ');
          const minPrice = withoutBudgetMatch.allMatches[0]?.priceRange || '₹1.65 Crore';
          responseText = `I couldn't find verified ${bhkQuery ? `${bhkQuery} ` : ''}properties in **${targetLoc}** under ${metadata.discovery.budget || 'your budget'} in our current listings. In ${targetLoc}, verified residences start from ${minPrice} (such as **${sampleNames}**).\n\nWould you like to explore these properties or adjust your budget range?`;
        } else {
          responseText = targetLoc && targetLoc !== 'Ahmedabad'
            ? `I couldn't find verified properties in **${targetLoc}** matching those exact specifications in our current listings. Would you like to explore nearby areas or adjust your budget range?`
            : `I couldn't find verified properties matching those exact specifications in our current listings. Would you like to explore nearby areas or adjust your budget range?`;
        }
      }
    }

    const quickReplies = chosenCards.length > 0
      ? ['Show more options ➕', 'Download brochure 📥', 'Schedule visit 📅']
      : ['Explore other properties 🏡', 'Adjust budget 💰', 'Explore nearby areas 📍'];

    const propertyCard = chosenCards[0] || null;
    const propertyCards = chosenCards;
    if (chosenCards.length > 0) {
      metadata.displayedProperties = chosenCards;
      metadata.lastViewedProperty = chosenCards[0];
    }

    // Auto-capture lead if phone info was provided
    if (metadata.lead.phone && !metadata.lead.captured) {
      metadata.lead.captured = true;
      await leadService.captureLead({
        projectId,
        sessionId,
        name: metadata.lead.name || metadata.userName || 'Website Visitor',
        phone: metadata.lead.phone,
        email: metadata.lead.email || null,
        intent: metadata.intent || 'buying',
        preferences: metadata.discovery,
        source: 'chatbot',
      });
    }

    // Save user message and assistant message
    await saveUserMessagePromise;

    metadata.stepIndex += 1;
    await Promise.all([
      messageRepository.createMessage({
        sessionId,
        role: 'ASSISTANT',
        content: responseText,
        metadata: {
          sources: retrievedChunks.map((c) => ({
            title: c.sourceTitle,
            url: c.sourceUrl,
            relevance: c.score,
          })),
          propertyCard,
          propertyCards,
        },
      }),
      sessionRepository.updateSession(sessionId, {
        userName: metadata.userName,
        intent: metadata.intent,
        location: metadata.discovery.location,
        sessionMetadata: metadata,
      }),
    ]);

    const sources = retrievedChunks.map((c) => ({
      title: c.sourceTitle,
      url: c.sourceUrl,
      relevance: parseFloat((c.score || 0.9).toFixed(2)),
      snippet: (c.content || '').slice(0, 160) + '...',
    }));

    this.logDiagnostic({
      requestId: requestId || `req-${Date.now()}`,
      assistantId: projectId,
      conversationId: sessionId,
      openaiStatus: chosenCards.length > 0 ? 'INVOKED' : 'SKIPPED',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      intent: isMoreRequest ? 'PROPERTY_SEARCH_MORE' : 'PROPERTY_SEARCH',
      criteria: {
        location: locationQuery,
        bhk: bhkQuery,
        budget: metadata.discovery.budget,
        budgetNum: metadata.discovery.budgetNum,
      },
      retrievalRequired: true,
      retrievalStatus: allMatches.length > 0 ? 'SUCCESS_WITH_RESULTS' : 'SUCCESS_WITH_NO_MATCHES',
      candidateCount: retrievedChunks.length,
      finalResultCount: chosenCards.length,
      durationMs: Date.now() - (startTime || Date.now()),
    });

    return {
      sessionId,
      message: responseText,
      context: metadata,
      sources,
      suggestions: quickReplies,
      quickReplies,
      propertyCard,
      propertyCards,
      leadCaptureRequired: false,
      advisorConnected: false,
    };
  }

  /**
   * Extract project name if user asks about a specific project
   */
  private extractTargetProject(text: string): string | undefined {
    const tl = text.toLowerCase();
    const known = [
      { name: 'Aahvan Greens', triggers: ['aahvan greens', 'aahvan'] },
      { name: 'Samatva Amaryllis', triggers: ['samatva amaryllis', 'samatva'] },
      { name: 'Ananta', triggers: ['ananta'] },
      { name: 'Satyamev Serene', triggers: ['satyamev serene', 'satyamev'] },
      { name: 'Shubh Green', triggers: ['shubh green', 'shubh'] },
      { name: 'Satyaa Heights', triggers: ['satyaa heights', 'satyaa'] },
      { name: 'The Nilyam', triggers: ['the nilyam', 'nilyam'] },
      { name: 'Shyam Heights 1', triggers: ['shyam heights 1', 'shyam heights', 'shyam'] },
      { name: 'B R Ekayan', triggers: ['b r ekayan', 'ekayan'] },
      { name: 'Siddharth Gardenia', triggers: ['siddharth gardenia', 'gardenia'] },
      { name: 'Harmony Harikesh', triggers: ['harmony harikesh', 'harikesh'] },
    ];
    for (const item of known) {
      for (const trig of item.triggers) {
        if (tl.includes(trig)) return item.name;
      }
    }
    return undefined;
  }

  /**
   * Resolve references to previously displayed properties (e.g. "second one", "1st property", "this project", "it")
   */
  private resolveReferencedProperty(
    text: string,
    metadata: ChatSessionMetadata
  ): {
    property: PropertyCardData | null;
    propertyIndex?: number;
    attributeRequested?: 'price' | 'amenities' | 'location' | 'configuration' | 'possession' | 'all';
  } {
    const tl = text.toLowerCase().trim();
    const displayed = metadata.displayedProperties || [];

    let index: number | undefined = undefined;

    // Ordinal matching
    if (/\b(first|1st|number 1|#1|first one|first property|first project)\b/i.test(tl)) {
      index = 0;
    } else if (/\b(second|2nd|number 2|#2|second one|second property|second project)\b/i.test(tl)) {
      index = 1;
    } else if (/\b(third|3rd|number 3|#3|third one|third property|third project)\b/i.test(tl)) {
      index = 2;
    } else if (/\b(fourth|4th|number 4|#4|fourth one|fourth property)\b/i.test(tl)) {
      index = 3;
    }

    let property: PropertyCardData | null = null;
    if (index !== undefined && displayed[index]) {
      property = displayed[index];
    } else if (/\b(this property|this project|the project|that property|that project|this one|it|its)\b/i.test(tl)) {
      property = metadata.lastViewedProperty || displayed[0] || null;
    }

    // Determine attribute requested
    let attributeRequested: 'price' | 'amenities' | 'location' | 'configuration' | 'possession' | 'all' = 'all';
    if (/\b(price|pricing|cost|rate|budget|how much)\b/i.test(tl)) {
      attributeRequested = 'price';
    } else if (/\b(amenities|amenity|facilities|facility|features|gym|pool|garden|clubhouse)\b/i.test(tl)) {
      attributeRequested = 'amenities';
    } else if (/\b(location|where|address|area|locality|landmark)\b/i.test(tl)) {
      attributeRequested = 'location';
    } else if (/\b(bhk|configuration|configurations|size|sqft|area|carpet area)\b/i.test(tl)) {
      attributeRequested = 'configuration';
    } else if (/\b(possession|possession date|ready|completion|handover)\b/i.test(tl)) {
      attributeRequested = 'possession';
    }

    return { property, propertyIndex: index, attributeRequested };
  }

  /**
   * Clean intent classifier adhering to real-estate specific boundaries
   */
  private classifyIntent(
    userText: string,
    metadata: ChatSessionMetadata
  ): MessageIntent {
    const tl = userText.toLowerCase().trim();

    // 1. OUT_OF_SCOPE: questions completely unrelated to real estate
    const outOfScopePatterns = [
      /\b(recommend|suggest|what|any)\b.*\b(movie|movies|film|films|cinema|actor|actress|bollywood|hollywood|imdb|web series)\b/i,
      /\b(movie|movies|film|films|imdb|cinema)\b/i,
      /\b(recipe|how to cook|bake|pizza|burger|pasta|biryani|restaurant recommendation|curry|dessert|dish)\b/i,
      /\b(cricket|football|fifa|world cup score|ipl match|who won the match|sports|tennis|olympics|messi|ronaldo|virat kohli)\b/i,
      /\b(president of|prime minister of|election results|politics|government)\b/i,
      /\b(write a python|write javascript|code for|debug my code|program to|python code|help me debug|programming)\b/i,
      /\b(tell me a joke|write a poem|sing a song|who is elon musk|who is einstein)\b/i,
      /\bweather in (paris|london|new york|tokyo|sydney|berlin|dubai)\b/i,
      /\bwhat is the capital of\b/i,
      /\bcapital of japan\b/i,
      /\bcapital of france\b/i,
    ];
    for (const pattern of outOfScopePatterns) {
      if (pattern.test(tl)) {
        return 'OUT_OF_SCOPE';
      }
    }

    // 2. GENERAL_REAL_ESTATE: General definitions or real estate terminology questions
    const generalRealEstatePatterns = [
      /\b(is|are)\s+[a-z0-9\s]+(good|great|recommended|safe|wise|worth)\s+(area|locality|place|option|choice|investment)\b/i,
      /\b(why should|why would|why do)\b.*\b(buy|rent|invest|purchase)\b/i,
      /\b(risk|risks|advantage|advantages|benefit|benefits|pros and cons|difference between|compare)\b.*\b(under-construction|ready-to-move|under construction|ready to move|buying|renting)\b/i,
      /\b(under-construction|under construction|ready-to-move|ready to move)\b.*\b(risk|risks|advantage|advantages|benefit|benefits|pros and cons|difference|compare)\b/i,
      /\bwhat (is|does|do) (a |the )?(3\s*bhk|2\s*bhk|4\s*bhk|bhk|rera|carpet area|super built|built up|stamp duty|possession|home loan|pre-emi|registry|emi)\b/i,
      /\bwhat does (3\s*bhk|2\s*bhk|bhk|rera|carpet area) (mean|stand for)\b/i,
      /\b(difference between|explain) (carpet area|super built|flat and apartment|buy or rent|buying or renting|freehold and leasehold|ready to move|under construction)\b/i,
      /\b(process of buying|how to buy a house|documents required for home loan|what is rera)\b/i,
      /\b(explain|tell me about)\s+(ready-to-move|under-construction|rera|carpet area|super built-up)\b/i,
      /\b(good area for property investment|good locality to invest|investment potential)\b/i,
    ];
    for (const pattern of generalRealEstatePatterns) {
      if (pattern.test(tl)) {
        // If user also specifically asks to "show properties in Gota", prioritize search
        if (!tl.includes('show me') && !tl.includes('recommend') && !tl.includes('available in') && !tl.includes('options in')) {
          return 'GENERAL_REAL_ESTATE';
        }
      }
    }

    // General question indicator: any natural inquiry containing question words or question mark
    const isGeneralInquiry =
      /\?$/.test(tl) ||
      /\b(why|what|is |are |how |can |should |explain|tell me about|difference between|advantages of|risks of)\b/i.test(tl);
    if (isGeneralInquiry && !metadata.explicitSearchRequested && !tl.includes('show me') && !tl.includes('find me') && !tl.includes('options in') && !tl.includes('show properties')) {
      return 'GENERAL_REAL_ESTATE';
    }

    // 3. PROPERTY_SEARCH_MORE: Request for next/additional properties
    if (
      tl.includes('show me more') ||
      tl.includes('more options') ||
      tl.includes('any other options') ||
      tl.includes('show more properties') ||
      tl.includes('see some alternatives') ||
      tl.includes('see alternatives') ||
      tl.includes('more properties') ||
      tl === 'more' ||
      tl === 'show more' ||
      tl === 'other options'
    ) {
      return 'PROPERTY_SEARCH_MORE';
    }

    // 4. PROPERTY_INFORMATION: Asking about a particular project or previously displayed property
    const targetProjectName = this.extractTargetProject(userText);
    const resolvedRef = this.resolveReferencedProperty(userText, metadata);
    if (targetProjectName) {
      return 'PROPERTY_INFORMATION';
    }
    if (resolvedRef.property && (
      resolvedRef.attributeRequested !== 'all' ||
      tl.includes('tell me about') ||
      tl.includes('show me') ||
      tl.includes('details') ||
      tl.includes('price') ||
      tl.includes('amenities') ||
      tl.includes('location') ||
      tl.includes('brochure')
    )) {
      return 'PROPERTY_INFORMATION';
    }

    // Handle explicit configuration/action buttons before search
    if (
      tl.includes('adjust budget') ||
      tl.includes('change budget') ||
      tl.includes('update budget') ||
      tl.includes('explore nearby') ||
      tl.includes('nearby areas')
    ) {
      return 'CLARIFICATION';
    }

    // 5. PROPERTY_SEARCH: Explicit request to find/recommend properties
    const explicitSearchTriggers = [
      'show me',
      'recommend',
      'find me',
      'find properties',
      'find flats',
      'find apartments',
      'what properties',
      'properties available',
      'flats available',
      'apartments available',
      'options in',
      'flats in',
      'properties in',
      'apartments in',
      'bhk flats in',
      'bhk flats',
      'bhk in',
      'explore other properties',
      'explore other options',
      'other properties',
      'explore all properties',
      'show other properties',
      'explore properties',
      'show properties',
      'show matching properties',
      'show verified properties',
    ];
    for (const trigger of explicitSearchTriggers) {
      if (tl.includes(trigger)) {
        return 'PROPERTY_SEARCH';
      }
    }

    // If in confirmation state and user agrees to see matching properties:
    if (metadata.state === 'DISCOVERY_CONFIRM_SEARCH') {
      if (
        tl.includes('yes') ||
        tl.includes('show') ||
        tl.includes('sure') ||
        tl.includes('please') ||
        tl.includes('okay') ||
        tl.includes('ok') ||
        tl.includes('matching') ||
        tl.includes('explore')
      ) {
        return 'PROPERTY_SEARCH';
      }
    }

    // Complete property search query in one message:
    // If user provided location, BHK, and budget/intent, and text conveys search
    const hasLocation = Boolean(metadata.discovery.location);
    const hasBHK = Boolean(metadata.discovery.bhk || metadata.discovery.homeType);
    const hasBudget = Boolean(metadata.discovery.budget || metadata.discovery.budgetNum || metadata.discovery.rentMonthly);
    if (hasLocation && hasBHK && hasBudget) {
      if (
        tl.includes('show') ||
        tl.includes('looking to') ||
        tl.includes('looking for') ||
        tl.includes('want to') ||
        tl.includes('find') ||
        tl.includes('options') ||
        metadata.explicitSearchRequested
      ) {
        return 'PROPERTY_SEARCH';
      }
    }

    // If already in active property search, filter refinements (budget, bhk, amenities) continue search
    if (metadata.state === 'PROPERTY_SEARCH' && metadata.explicitSearchRequested) {
      if (
        /([0-9.]+\s*(?:cr|crore|crores|lakh|lakhs|lac|lacs))/i.test(tl) ||
        /(2\s*bhk|3\s*bhk|4\s*bhk|villa|apartment|flat)/i.test(tl) ||
        /(garden|balcony|gym|pool|terrace|parking)/i.test(tl)
      ) {
        return 'PROPERTY_SEARCH';
      }
    }

    // 6. GREETING:
    if (/^(hi|hello|hey|good morning|good afternoon|good evening|namaste|greetings)[\s!.]*$/i.test(tl)) {
      return 'GREETING';
    }
    // User giving name in GREETING state (only if NOT containing property search terms)
    if (metadata.state === 'GREETING' && !tl.includes('bhk') && !tl.includes('buy') && !tl.includes('rent') && !hasLocation) {
      const isNamePattern = /^(?:i am|my name is|i'm|call me|this is)\s+[a-zA-Z]+$/i.test(tl);
      const isShortName = tl.length < 20 && !tl.includes('flat') && !tl.includes('property') && !tl.includes('looking') && !tl.includes('want');
      if (isNamePattern || isShortName) {
        return 'GREETING';
      }
    }

    // Explicit brochure or download request (takes priority over clarification loops)
    if (tl.includes('brochure') || tl.includes('download')) {
      return 'CONVERSATION';
    }

    // 7. CLARIFICATION: Answering discovery questions or providing preferences
    if (
      metadata.state === 'INTENT_DETECTION' ||
      metadata.state === 'NAME_COLLECTED' ||
      metadata.state === 'DISCOVERY_PERSONAL' ||
      metadata.state === 'DISCOVERY_LOCATION' ||
      metadata.state === 'DISCOVERY_HOME_TYPE' ||
      metadata.state === 'DISCOVERY_MUST_HAVE' ||
      metadata.state === 'DISCOVERY_BUDGET' ||
      metadata.state === 'DISCOVERY_CONFIRM_SEARCH' ||
      tl.includes('bhk') ||
      tl.includes('buy') ||
      tl.includes('rent') ||
      tl.includes('budget') ||
      tl.includes('crore') ||
      tl.includes('lakh') ||
      hasLocation ||
      hasBHK
    ) {
      return 'CLARIFICATION';
    }

    // 8. CONVERSATION: polite acknowledgments / small talk
    if (/^(thanks|thank you|ok|okay|cool|nice|got it|sounds good|bye|goodbye)[\s!.]*$/i.test(tl)) {
      return 'CONVERSATION';
    }

    return 'CONVERSATION';
  }

  /**
   * Entity and preference extraction from free-text user messages
   */
  private extractAndStoreMemory(text: string, metadata: ChatSessionMetadata) {
    const tl = text.toLowerCase();

    // Name Extraction
    if (!metadata.userName) {
      const nameMatch = text.match(/(?:you can call me|i am|i'm|my name is|this is|call me)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i);
      if (nameMatch && nameMatch[1]) {
        const candidate = nameMatch[1].trim();
        const firstWord = candidate.split(/\s+/)[0].toLowerCase();
        const stopWords = ['looking', 'searching', 'buying', 'renting', 'here', 'interested', 'trying', 'planning', 'just', 'a', 'an', 'the'];
        if (!stopWords.includes(firstWord)) {
          const name = candidate.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          metadata.userName = name;
          metadata.lead.name = name;
        }
      } else if (
        metadata.state === 'GREETING' &&
        text.length < 35 &&
        !tl.includes('hi') &&
        !tl.includes('hello') &&
        !tl.includes('looking') &&
        !tl.includes('bhk') &&
        !tl.includes('want') &&
        !tl.includes('buy') &&
        !tl.includes('rent') &&
        !tl.includes('flat') &&
        !tl.includes('property')
      ) {
        const clean = text.replace(/[^a-zA-Z\s]/g, '').trim();
        if (clean.length > 1) {
          const name = clean.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          metadata.userName = name;
          metadata.lead.name = name;
        }
      }
    }

    // Phone Extraction
    const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}/) || text.match(/(\+?\d[\d\s\-]{8,15}\d)/);
    if (phoneMatch && !metadata.lead.phone) {
      metadata.lead.phone = phoneMatch[0].trim();
    }

    // Email Extraction
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !metadata.lead.email) {
      metadata.lead.email = emailMatch[0].trim();
    }

    // Location Extraction
    // First, guard against setting an outside-Ahmedabad city into discovery.location
    const outsideCheck = localityDiscoveryService.isOutsideAhmedabad(text);
    if (!outsideCheck.isOutside) {
      let extractedLoc: string | null = null;

      // Pattern 1: common Ahmedabad locality names (highest priority exact match)
      const commonLocations = [
        'science city', 'south bopal', 'prahlad nagar', 'prahladnagar', 'sg highway', 'gift city',
        'sindhu bhavan road', 'sindhu bhavan', 'gota', 'tragad', 'chandkheda',
        'jagatpur', 'vaishnodevi', 'zundal', 'ognaj', 'satellite', 'shilaj',
        'sola', 'thaltej', 'bodakdev', 'ambli', 'shela', 'bopal', 'vastrapur',
        'navrangpura', 'naranpura', 'memnagar', 'ghatlodia', 'ghatlodiya',
        'motera', 'maninagar', 'ranip', 'paldi', 'ambawadi', 'bhadaj', 'hebatpur'
      ];
      for (const loc of commonLocations) {
        const reg = new RegExp(`\\b${loc.replace(/\s+/g, '\\s+')}\\b`, 'i');
        if (reg.test(tl)) {
          extractedLoc = normalizeLocality(loc) || (loc.charAt(0).toUpperCase() + loc.slice(1));
          break;
        }
      }

      // Pattern 2: explicit preposition "in <location>", "at <location>", "near <location>", "around <location>" (NEVER "to")
      if (!extractedLoc) {
        const locMatch = tl.match(/(?:in|around|near|at|across)\s+([a-zA-Z\s]{2,25})(?:[,.]|$)/i);
        if (locMatch && locMatch[1]) {
          let candidate = locMatch[1].trim();
          candidate = candidate.replace(/\s+(?:instead|please|also|too|now)\b/gi, '').trim();
          const nonLocationStopWords = [
            'buy', 'buying', 'buyer', 'purchase', 'purchasing',
            'rent', 'renting', 'lease', 'leasing',
            'sell', 'selling', 'sale',
            'explore', 'exploring', 'look', 'looking', 'find', 'finding', 'see', 'seeing',
            'invest', 'investing', 'investment',
            'flat', 'flats', 'apartment', 'apartments', 'property', 'properties', 'home', 'homes', 'house', 'houses', 'villa', 'villas',
            'bhk', '1bhk', '2bhk', '3bhk', '4bhk', '5bhk',
            'budget', 'price', 'pricing', 'cost', 'crore', 'crores', 'lakh', 'lakhs',
            'ahmedabad', 'gujarat', 'india',
            'me', 'my', 'the', 'a', 'an', 'mind', 'options', 'verified', 'residential', 'commercial',
            'here', 'there', 'somewhere', 'anywhere', 'everywhere',
            'now', 'please', 'also', 'too', 'details', 'brochure', 'brochures',
            'garden', 'gardens', 'a garden', 'park', 'parks', 'greenery',
            'balcony', 'balconies', 'terrace', 'gym', 'pool', 'swimming pool', 'clubhouse',
            'school', 'hospital', 'temple', 'metro', 'highway', 'road', 'lake'
          ];
          if (!nonLocationStopWords.includes(candidate.toLowerCase())) {
            extractedLoc = normalizeLocality(candidate) || (candidate.charAt(0).toUpperCase() + candidate.slice(1));
          }
        }
      }

      if (extractedLoc && extractedLoc.toLowerCase() !== 'ahmedabad') {
        const cLow = extractedLoc.toLowerCase();
        if (cLow !== 'buy' && cLow !== 'rent' && cLow !== 'sell' && cLow !== 'explore' && cLow !== 'looking') {
          if (metadata.discovery.location !== extractedLoc) {
            metadata.discovery.location = extractedLoc;
            metadata.displayedPropertyTitles = [];
            metadata.displayedProperties = [];
            // If the user changed location without specifying a budget in this new message, clear previous budget
            const hasBudgetMentioned = /(?:₹|rs\.?|inr|[0-9.]+\s*(?:cr|crore|crores|lakh|lakhs|lac|lacs|k|\/mo|month))/i.test(text);
            if (!hasBudgetMentioned) {
              metadata.discovery.budgetNum = undefined;
              metadata.discovery.budget = undefined;
              metadata.discovery.budgetMax = undefined;
              metadata.discovery.rentMonthly = undefined;
            }
          }
        }
      }
    }

    // BHK Extraction
    if (/5\s*bhk|5\s*bed/i.test(tl)) {
      metadata.discovery.bhk = '5 BHK';
      metadata.discovery.homeType = '5 BHK Palatial Sky Villa';
    } else if (/4\s*bhk|4\s*bed/i.test(tl)) {
      metadata.discovery.bhk = '4 BHK';
      metadata.discovery.homeType = '4 BHK Sky Villa';
    } else if (/3\s*bhk|3\s*bed/i.test(tl)) {
      metadata.discovery.bhk = '3 BHK';
      metadata.discovery.homeType = '3 BHK Luxury Living';
    } else if (/2\s*bhk|2\s*bed/i.test(tl)) {
      metadata.discovery.bhk = '2 BHK';
      metadata.discovery.homeType = '2 BHK Smart Residence';
    } else if (/1\s*bhk|1\s*bed/i.test(tl)) {
      metadata.discovery.bhk = '1 BHK';
      metadata.discovery.homeType = '1 BHK Compact Apartment';
    }

    // Budget & Rent Extraction (Distinguish monthly rent from purchase budget)
    const isRelaxBudget =
      tl.includes('explore other') ||
      tl.includes('other properties') ||
      tl.includes('explore all') ||
      tl.includes('all properties') ||
      tl.includes('without budget') ||
      tl.includes('no budget');

    const hasBudgetKeywords = /(?:₹|rs\.?|inr|[0-9.]+\s*(?:cr|crore|crores|lakh|lakhs|lac|lacs|k|\/mo|month))/i.test(text);

    if (isRelaxBudget) {
      metadata.discovery.budgetNum = undefined;
      metadata.discovery.budget = undefined;
      metadata.discovery.budgetMax = undefined;
      metadata.discovery.rentMonthly = undefined;
    } else if (
      !hasBudgetKeywords &&
      (tl.includes('flats in') ||
        tl.includes('properties in') ||
        tl.includes('bhk flats') ||
        tl.includes('flats for sale') ||
        (metadata.displayedProperties?.length === 0 && metadata.state === 'PROPERTY_SEARCH'))
    ) {
      // User is asking a new search or follow-up query without budget constraints
      metadata.discovery.budgetNum = undefined;
      metadata.discovery.budget = undefined;
      metadata.discovery.budgetMax = undefined;
      metadata.discovery.rentMonthly = undefined;
    }

    const rentMonthlyRegex = /(?:around|under|below|within|upto|about)?\s*(?:₹|rs\.?|inr)?\s*([0-9,]+(?:\.[0-9]+)?)\s*(k)?\s*(?:per month|\/month|monthly|\/mo|per mo)/i;
    const rentExplicitRegex = /rent\s*(?:around|under|about|of)?\s*(?:₹|rs\.?|inr)?\s*([0-9,]+(?:\.[0-9]+)?)\s*(k)?/i;
    const rentMatch = tl.match(rentMonthlyRegex) || tl.match(rentExplicitRegex);

    if (rentMatch && rentMatch[1]) {
      let num = parseFloat(rentMatch[1].replace(/,/g, ''));
      if (rentMatch[2] && rentMatch[2].toLowerCase() === 'k') num *= 1000;
      if (!isNaN(num)) {
        metadata.discovery.rentMonthly = num;
        metadata.discovery.budgetMax = num;
        metadata.discovery.budget = `₹${num.toLocaleString('en-IN')}/month`;
        metadata.intent = 'rent';
      }
    } else {
      // Purchase Budget Extraction
      const crMatch = tl.match(/(?:around|under|below|within|upto|up to|about)?\s*(?:₹|rs\.?|inr)?\s*([0-9.]+)\s*(?:cr|crore|crores)/i);
      if (crMatch) {
        const val = parseFloat(crMatch[1]);
        if (!isNaN(val)) {
          metadata.discovery.budget = `₹${val} Crore`;
          metadata.discovery.budgetNum = val * 100;
          metadata.discovery.budgetMax = val * 100;
        }
      } else {
        const lakhMatch = tl.match(/(?:around|under|below|within|upto|up to|about)?\s*(?:₹|rs\.?|inr)?\s*([0-9.]+)\s*(?:lakh|lac|lacs|lakhs)/i);
        if (lakhMatch) {
          const val = parseFloat(lakhMatch[1]);
          if (!isNaN(val)) {
            metadata.discovery.budget = `₹${val} Lakhs`;
            metadata.discovery.budgetNum = val;
            metadata.discovery.budgetMax = val;
          }
        }
      }
    }

    // Nearby / Must-Have Preferences
    if (tl.includes('garden') || tl.includes('green') || tl.includes('park')) {
      metadata.discovery.mustHave = 'Landscaped Garden & Greenery';
      metadata.discovery.nearbyPreference = 'garden';
    } else if (tl.includes('balcony') || tl.includes('terrace')) {
      metadata.discovery.mustHave = 'Wide Scenic Balcony';
    } else if (tl.includes('gym') || tl.includes('pool') || tl.includes('club')) {
      metadata.discovery.mustHave = 'Clubhouse, Gym & Swimming Pool';
    }

    // Intent signals
    if (/\b(rent|renting|lease|on rent|for rent)\b/i.test(tl)) {
      metadata.intent = 'rent';
    } else if (/\b(buy|buying|purchase|invest|looking to buy|want to buy)\b/i.test(tl)) {
      metadata.intent = 'buy';
    } else if (!metadata.intent && (tl.includes('bhk') || tl.includes('propert') || tl.includes('flat') || tl.includes('crore') || tl.includes('lakh') || metadata.discovery.location)) {
      metadata.intent = 'buy';
    }

    // Detect explicit search requested
    if (/\b(show me|find me|recommend|options in|search)\b/i.test(tl)) {
      metadata.explicitSearchRequested = true;
    }
  }

  /**
   * Helper to build known context summary for LLM prompt
   */
  private buildKnownContextSummary(metadata: ChatSessionMetadata): string {
    const parts: string[] = [];
    if (metadata.userName) parts.push(`Name: ${metadata.userName}`);
    if (metadata.intent) parts.push(`Intent: ${metadata.intent}`);
    if (metadata.discovery.location) parts.push(`Location: ${metadata.discovery.location}`);
    if (metadata.discovery.bhk) parts.push(`Configuration: ${metadata.discovery.bhk}`);
    else if (metadata.discovery.homeType) parts.push(`Home Type: ${metadata.discovery.homeType}`);
    if (metadata.discovery.rentMonthly) parts.push(`Monthly Rent: ₹${metadata.discovery.rentMonthly.toLocaleString('en-IN')}/mo`);
    else if (metadata.discovery.budget) parts.push(`Budget: ${metadata.discovery.budget}`);
    if (metadata.discovery.mustHave) parts.push(`Must-have: ${metadata.discovery.mustHave}`);
    return parts.join(', ');
  }

  /**
   * Structured, privacy-conscious diagnostic logging
   */
  public logDiagnostic(data: {
    requestId: string;
    assistantId: string;
    conversationId: string;
    openaiStatus: 'INVOKED' | 'SKIPPED' | 'FAILED';
    model: string;
    intent: string;
    criteria?: Record<string, any>;
    retrievalRequired: boolean;
    retrievalStatus: string;
    candidateCount: number;
    finalResultCount: number;
    durationMs: number;
    errorCategory?: string;
  }) {
    logger.info(`[CHATBOT_DIAGNOSTIC] ${JSON.stringify(data)}`);
  }
}

export const conversationService = new ConversationService();
