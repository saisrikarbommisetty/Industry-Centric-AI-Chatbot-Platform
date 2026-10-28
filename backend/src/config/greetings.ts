export const PRYCOONS_WELCOME_MESSAGES: string[] = [
  "Welcome to Prycoons! May I know your name, or are you looking to explore properties in Ahmedabad?",
  "Hi there! What should I call you, or are you looking to buy or rent a property in Ahmedabad?",
  "Hello! Welcome to Prycoons. What is your name, or how can we assist with your property search?",
  "Hi! Welcome to Prycoons. May I have your name, or let's find a property that suits your needs.",
  "Welcome to Prycoons! What should we call you, or what kind of property are you looking for?",
];

export const FORBIDDEN_NAMES = new Set([
  'yes', 'yeah', 'yep', 'yup', 'sure', 'ok', 'okay', 'fine', 'no', 'nope', 'nah',
  'hi', 'hello', 'hey', 'namaste', 'greetings', 'good morning', 'good afternoon', 'good evening',
  'buy', 'buying', 'rent', 'renting', 'explore', 'exploring', 'browse', 'browsing', 'invest', 'investing',
  'property', 'properties', 'flat', 'flats', 'apartment', 'apartments', 'house', 'houses', 'villa', 'villas',
  'bhk', '1bhk', '2bhk', '3bhk', '4bhk', '5bhk',
  'ahmedabad', 'gota', 'sola', 'science city', 'bodakdev', 'ambli', 'tragad', 'prahlad nagar',
  'crore', 'lakh', 'budget', 'price', 'rates',
  'nothing', 'none', 'later', 'skip', 'idk', 'dont know', "don't know", 'prefer not to say', 'no name',
  'please', 'thanks', 'thank you', 'welcome', 'great', 'awesome', 'cool'
]);

export function isValidPersonName(name?: string | null): boolean {
  if (!name) return false;
  const cleaned = name.trim().toLowerCase().replace(/[^a-zA-Z\s]/g, '');
  if (!cleaned || cleaned.length < 2 || cleaned.length > 30) return false;
  if (FORBIDDEN_NAMES.has(cleaned)) return false;

  const words = cleaned.split(/\s+/);
  if (words.length > 3) return false;
  for (const w of words) {
    if (FORBIDDEN_NAMES.has(w)) return false;
  }
  return true;
}

export function formatPersonName(name: string): string {
  return name
    .trim()
    .replace(/[^a-zA-Z\s]/g, '')
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function extractPersonNameFromText(text: string): string | null {
  if (!text) return null;
  const trimmed = text.trim();

  // Pattern 1: Explicit introduction prefixes
  const prefixMatch = trimmed.match(
    /(?:i am|i'm|my name is|this is|call me|myself|you can call me)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i
  );
  if (prefixMatch && prefixMatch[1]) {
    const candidate = prefixMatch[1].trim();
    if (isValidPersonName(candidate)) {
      return formatPersonName(candidate);
    }
  }

  // Pattern 2: Standalone 1-2 word name
  const words = trimmed.split(/\s+/);
  if (words.length <= 2 && /^[a-zA-Z\s]+$/.test(trimmed)) {
    if (isValidPersonName(trimmed)) {
      return formatPersonName(trimmed);
    }
  }

  return null;
}

export function getWelcomeMessageForSession(sessionId?: string): string {
  if (!sessionId) {
    const idx = Math.floor(Math.random() * PRYCOONS_WELCOME_MESSAGES.length);
    return PRYCOONS_WELCOME_MESSAGES[idx];
  }
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = (hash << 5) - hash + sessionId.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % PRYCOONS_WELCOME_MESSAGES.length;
  return PRYCOONS_WELCOME_MESSAGES[idx];
}
