export interface LocationContext {
  city: string;
  region: string;
  country: string;
  weatherSummary?: string;
  temperature?: string;
}

export interface TimeContext {
  period: 'morning' | 'afternoon' | 'evening' | 'night';
  greeting: string;
  subtext: string;
  icebreaker: string;
  localHour: number;
  timeZone: string;
}

export class LocationService {
  /**
   * Get location details from request headers or fallback to default
   */
  getLocationFromRequest(headers?: Record<string, string | string[] | undefined>): LocationContext {
    // Check Cloudflare, Vercel, or reverse proxy headers if present
    const cityHeader = headers?.['x-vercel-ip-city'] || headers?.['cf-ipcity'];
    const city = Array.isArray(cityHeader) ? cityHeader[0] : cityHeader || 'Ahmedabad';

    return {
      city: city || 'Ahmedabad',
      region: 'Gujarat',
      country: 'India',
      // Omit invented weather unless configured with real weather API
    };
  }

  /**
   * Centralized greeting & time policy
   * - Morning: 5:00 AM–11:59 AM (hours 5 to 11)
   * - Afternoon: 12:00 PM–4:59 PM (hours 12 to 16)
   * - Evening: 5:00 PM–8:59 PM (hours 17 to 20)
   * - Night: 9:00 PM–4:59 AM (hours 21 to 23, 0 to 4)
   * Avoids awkward output like "It's good evening!", uses clean natural "Good evening!"
   */
  getTimeContext(options?: number | { customHour?: number; timeZone?: string }): TimeContext {
    let localHour: number;
    let effectiveTimeZone = 'Asia/Kolkata';

    if (typeof options === 'number') {
      localHour = options;
    } else if (options?.customHour !== undefined) {
      localHour = options.customHour;
      if (options.timeZone) effectiveTimeZone = options.timeZone;
    } else if (options?.timeZone) {
      effectiveTimeZone = options.timeZone;
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: options.timeZone,
          hour: 'numeric',
          hour12: false,
        });
        const hourStr = formatter.format(new Date());
        localHour = parseInt(hourStr, 10) % 24;
      } catch {
        effectiveTimeZone = 'UTC';
        localHour = new Date().getUTCHours();
      }
    } else {
      localHour = new Date().getHours();
    }

    if (localHour >= 5 && localHour < 12) {
      return {
        period: 'morning',
        greeting: 'Good morning',
        subtext: 'Starting the day bright and early 🌅.',
        icebreaker: 'Hope you have a wonderful and productive day ahead!',
        localHour,
        timeZone: effectiveTimeZone,
      };
    } else if (localHour >= 12 && localHour < 17) {
      return {
        period: 'afternoon',
        greeting: 'Good afternoon',
        subtext: 'Hope your day is going smoothly 😊.',
        icebreaker: 'Hope your day is going great!',
        localHour,
        timeZone: effectiveTimeZone,
      };
    } else if (localHour >= 17 && localHour < 21) {
      return {
        period: 'evening',
        greeting: 'Good evening',
        subtext: 'Winding down for the day 🌆.',
        icebreaker: 'Hope you had a fulfilling day!',
        localHour,
        timeZone: effectiveTimeZone,
      };
    } else {
      return {
        period: 'night',
        greeting: 'Good evening',
        subtext: 'Resting and unwinding for the night 🌙.',
        icebreaker: 'Hope you are having a peaceful night!',
        localHour,
        timeZone: effectiveTimeZone,
      };
    }
  }
}

export const locationService = new LocationService();

