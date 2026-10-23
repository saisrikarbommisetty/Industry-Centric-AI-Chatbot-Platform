/**
 * Authoritative Prycoons Organization & Contact Configuration
 * Single source of truth for company contact details.
 */

export const OFFICIAL_PRYCOONS_CONTACT = {
  organizationName: 'Prycoons Real Estate',
  email: 'admin@prycoons.com',
  phone: '+91 7861072811',
  websiteUrl: 'https://prycoons.com/',
  city: 'Ahmedabad',
  state: 'Gujarat',
  country: 'India',
  contactCallToAction: 'Contact Prycoons for further property information.',
} as const;

export const OBSOLETE_CONTACT_NUMBERS = [
  '+91 98250 14890',
  '+91 9825014890',
  '98250 14890',
  '9825014890',
] as const;
