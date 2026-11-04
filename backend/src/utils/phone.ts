/**
 * Phone Number Utilities for Indian Mobile Numbers (+91)
 */

export interface PhoneValidationResult {
  isValid: boolean;
  normalized?: string; // Formatted as +91 XXXXX XXXXX
  raw: string;
  error?: string;
}

/**
 * Validates whether an input string is a valid Indian mobile number.
 * Standard Indian mobile numbers:
 * - 10 digits starting with 6, 7, 8, or 9
 * - Optional +91 or 91 or 0 prefix
 * - Optional spaces or dashes between numbers
 */
export function validateIndianMobile(phoneStr?: string | null): PhoneValidationResult {
  if (!phoneStr || typeof phoneStr !== 'string') {
    return { isValid: false, raw: '', error: 'Phone number is empty' };
  }

  const raw = phoneStr.trim();
  // Strip all whitespace, hyphens, parentheses, and dots
  const cleaned = raw.replace(/[\s\-\(\)\.]/g, '');

  // Check for international +91 prefix
  let digits = cleaned;
  if (digits.startsWith('+91')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('0091')) {
    digits = digits.slice(4);
  } else if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }

  // Must now be exactly 10 digits starting with 6, 7, 8, or 9
  const isValid = /^[6-9]\d{9}$/.test(digits);
  if (isValid) {
    const formatted = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    return {
      isValid: true,
      normalized: formatted,
      raw,
    };
  }

  return {
    isValid: false,
    raw,
    error: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.',
  };
}

/**
 * Extracts a valid Indian mobile number from freeform text.
 * Handles messages like:
 * - "My number is 9825012345"
 * - "Call me at +91 98250 12345"
 * - "Rahul Sharma 9898012345"
 * - "9876543210"
 */
export function extractIndianMobileFromText(
  text?: string | null
): { raw: string; normalized: string } | null {
  if (!text || typeof text !== 'string') return null;

  // Regex matches potential Indian phone numbers with optional +91, 91, or 0
  const phonePatterns = [
    /(?:\+91[\-\s]?)?[6-9]\d{4}[\-\s]?\d{5}\b/g,
    /(?:\+91[\-\s]?)?[6-9]\d{9}\b/g,
    /\b0?[6-9]\d{9}\b/g,
    /(?:\+91[\-\s]?)?[6-9]\d{2}[\-\s]?\d{3}[\-\s]?\d{4}\b/g,
  ];

  for (const pattern of phonePatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      for (const m of matches) {
        const val = validateIndianMobile(m);
        if (val.isValid && val.normalized) {
          return {
            raw: m,
            normalized: val.normalized,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Detects whether the user is attempting to enter a phone number but it is malformed.
 */
export function isInvalidPhoneAttempt(text?: string | null): boolean {
  if (!text || typeof text !== 'string') return false;
  const cleaned = text.trim();

  // If it successfully extracts a valid phone, then it's NOT invalid
  if (extractIndianMobileFromText(cleaned)) return false;

  // Pattern A: User explicitly mentioned phone/number/mobile followed by invalid digits
  const explicitAttempt = /(?:phone|mobile|number|call\s+me|whatsapp)\D*(\d{3,15})/i.test(cleaned);
  if (explicitAttempt) return true;

  // Pattern B: The entire message consists mostly of digits but not a valid Indian mobile
  const onlyDigits = cleaned.replace(/[\s\-\+\(\)]/g, '');
  if (/^\d{3,15}$/.test(onlyDigits)) {
    return true;
  }

  return false;
}

/**
 * Identifies if the user is declining to share their name or contact details.
 */
export function isDecliningResponse(text?: string | null): boolean {
  if (!text || typeof text !== 'string') return false;
  const t = text.trim().toLowerCase();

  const declinePatterns = [
    /^(no|nope|nah|skip|later|no thanks|no thank you|not now|not yet|pass|never)\b/i,
    /(?:prefer\s+not\s+to\s+(?:share|say|give))/i,
    /(?:don't|dont|do\s+not)\s+want\s+to\s+(?:share|give|provide)/i,
    /(?:won't|wont|will\s+not)\s+share/i,
    /(?:keep|stay)\s+(?:it\s+)?private/i,
    /(?:respect\s+my\s+privacy|my\s+privacy)/i,
    /(?:no\s+(?:need|number|phone|name))/i,
    /(?:not\s+interested\s+in\s+sharing)/i,
    /(?:without\s+(?:giving|sharing)\s+(?:my\s+)?(?:number|phone|name))/i,
  ];

  return declinePatterns.some((pattern) => pattern.test(t));
}

