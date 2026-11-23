import { SocialPlatform, PlatformDetectionResult } from './socialMedia.types';

// Tracking & Analytics query parameters to strip
const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'ref',
  'ref_src',
  'ref_url',
  's',
  't',
  'fbclid',
  'igsh',
  'si',
  'feature',
  'context',
  'src',
  'source',
  'trk',
  'trkcampaign',
  'midToken',
  'gclid',
  'mc_cid',
  'mc_eid',
  'wickedid',
]);

// Private and Loopback IP ranges for SSRF prevention
const BLOCKED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  '0.0.0.0',
  '169.254.169.254', // AWS metadata
  'metadata.google.internal', // GCP metadata
  'instance-data',
]);

export class UrlNormalizer {
  /**
   * Validate URL against security boundaries (SSRF, malicious schemes, format)
   */
  public static validate(rawUrl: string): { isValid: boolean; error?: string; urlObj?: URL } {
    if (!rawUrl || typeof rawUrl !== 'string') {
      return { isValid: false, error: 'URL must be a non-empty string.' };
    }

    const trimmed = rawUrl.trim();
    if (trimmed.length < 5 || trimmed.length > 2048) {
      return { isValid: false, error: 'URL length must be between 5 and 2048 characters.' };
    }

    let urlObj: URL;
    try {
      urlObj = new URL(trimmed);
    } catch {
      return { isValid: false, error: 'Invalid URL format. Please provide a complete valid URL (e.g. https://...)' };
    }

    // Only HTTP and HTTPS schemes permitted
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return { isValid: false, error: `Unsupported protocol "${urlObj.protocol}". Only HTTP and HTTPS are permitted.` };
    }

    const hostname = urlObj.hostname.toLowerCase();

    // Check SSRF blocked hosts and private ranges
    if (BLOCKED_HOSTS.has(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
      return { isValid: false, error: 'Access to private or local network resources is strictly prohibited.' };
    }

    // Check IPv4 private subnets (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16)
    if (/^127\./.test(hostname) ||
        /^10\./.test(hostname) ||
        /^192\.168\./.test(hostname) ||
        /^169\.254\./.test(hostname) ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) {
      return { isValid: false, error: 'Access to private network IP addresses is restricted.' };
    }

    return { isValid: true, urlObj };
  }

  /**
   * Detect platform from URL structure and return normalized information
   */
  public static detectPlatform(rawUrl: string): PlatformDetectionResult {
    const val = this.validate(rawUrl);
    if (!val.isValid || !val.urlObj) {
      return {
        platform: 'other',
        platformName: 'Other Platform',
        isSupported: false,
        canonicalUrl: rawUrl,
        normalizedUrl: rawUrl,
        error: val.error,
      };
    }

    const urlObj = val.urlObj;
    const hostname = urlObj.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
    const pathname = urlObj.pathname;

    // 1. YouTube
    if (hostname === 'youtube.com' || hostname === 'm.youtube.com' || hostname === 'youtu.be') {
      const canonical = this.canonicalizeYouTube(urlObj);
      return {
        platform: 'youtube',
        platformName: 'YouTube',
        isSupported: true,
        canonicalUrl: canonical,
        normalizedUrl: this.normalize(urlObj),
      };
    }

    // 2. X (Twitter)
    if (hostname === 'twitter.com' || hostname === 'x.com') {
      const canonical = this.canonicalizeTwitter(urlObj);
      return {
        platform: 'twitter',
        platformName: 'X (Twitter)',
        isSupported: true,
        canonicalUrl: canonical,
        normalizedUrl: this.normalize(urlObj),
      };
    }

    // 3. LinkedIn
    if (hostname === 'linkedin.com') {
      const canonical = this.canonicalizeLinkedIn(urlObj);
      return {
        platform: 'linkedin',
        platformName: 'LinkedIn',
        isSupported: true,
        canonicalUrl: canonical,
        normalizedUrl: this.normalize(urlObj),
      };
    }

    // 4. Instagram
    if (hostname === 'instagram.com' || hostname === 'instagr.am') {
      const canonical = this.canonicalizeInstagram(urlObj);
      return {
        platform: 'instagram',
        platformName: 'Instagram',
        isSupported: true,
        canonicalUrl: canonical,
        normalizedUrl: this.normalize(urlObj),
      };
    }

    // 5. Facebook
    if (hostname === 'facebook.com' || hostname === 'fb.watch' || hostname === 'fb.com') {
      const canonical = this.canonicalizeFacebook(urlObj);
      return {
        platform: 'facebook',
        platformName: 'Facebook',
        isSupported: true,
        canonicalUrl: canonical,
        normalizedUrl: this.normalize(urlObj),
      };
    }

    // 6. TikTok
    if (hostname === 'tiktok.com' || hostname === 'vm.tiktok.com' || hostname === 'vt.tiktok.com') {
      const canonical = this.canonicalizeTikTok(urlObj);
      return {
        platform: 'tiktok',
        platformName: 'TikTok',
        isSupported: true,
        canonicalUrl: canonical,
        normalizedUrl: this.normalize(urlObj),
      };
    }

    // 7. Generic / Other Web Page
    return {
      platform: 'other',
      platformName: 'Other Platform',
      isSupported: true,
      canonicalUrl: this.normalize(urlObj),
      normalizedUrl: this.normalize(urlObj),
    };
  }

  /**
   * Generic URL normalization: strips tracking query params, lowercases domain, removes trailing slash
   */
  public static normalize(urlInput: string | URL): string {
    let urlObj: URL;
    try {
      urlObj = typeof urlInput === 'string' ? new URL(urlInput.trim()) : new URL(urlInput.toString());
    } catch {
      return typeof urlInput === 'string' ? urlInput.trim() : '';
    }

    // Standardize protocol to https if port is 443
    const protocol = 'https:';
    const hostname = urlObj.hostname.toLowerCase().replace(/^www\./, '');

    // Strip tracking parameters from searchParams
    const cleanParams = new URLSearchParams();
    urlObj.searchParams.forEach((value, key) => {
      if (!TRACKING_PARAMS.has(key.toLowerCase())) {
        cleanParams.append(key, value);
      }
    });

    const search = cleanParams.toString() ? `?${cleanParams.toString()}` : '';
    // Strip trailing slash from pathname unless it's just root
    let pathname = urlObj.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    return `${protocol}//${hostname}${pathname}${search}`;
  }

  /**
   * Compare two URLs for duplicate detection considering canonical forms and tracking parameters
   */
  public static isSameUrl(urlA: string, urlB: string): boolean {
    if (!urlA || !urlB) return false;
    if (urlA.trim() === urlB.trim()) return true;

    const normA = this.normalize(urlA);
    const normB = this.normalize(urlB);
    if (normA === normB) return true;

    const platA = this.detectPlatform(urlA);
    const platB = this.detectPlatform(urlB);
    if (platA.canonicalUrl && platB.canonicalUrl && platA.canonicalUrl === platB.canonicalUrl) {
      return true;
    }

    return false;
  }

  // ── Canonical Platform Helpers ──────────────────────────────────────────

  private static canonicalizeYouTube(urlObj: URL): string {
    const hostname = urlObj.hostname.toLowerCase().replace(/^www\./, '');
    let videoId = '';

    if (hostname === 'youtu.be') {
      videoId = urlObj.pathname.slice(1).split('/')[0];
    } else if (urlObj.pathname.startsWith('/shorts/')) {
      videoId = urlObj.pathname.replace('/shorts/', '').split('/')[0];
    } else if (urlObj.pathname.startsWith('/watch')) {
      videoId = urlObj.searchParams.get('v') || '';
    } else if (urlObj.pathname.startsWith('/embed/')) {
      videoId = urlObj.pathname.replace('/embed/', '').split('/')[0];
    }

    if (videoId) {
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
    return this.normalize(urlObj);
  }

  private static canonicalizeTwitter(urlObj: URL): string {
    // Matches /:user/status/:id
    const match = urlObj.pathname.match(/\/([a-zA-Z0-9_]+)\/status\/(\d+)/i);
    if (match) {
      return `https://x.com/${match[1]}/status/${match[2]}`;
    }
    return this.normalize(urlObj);
  }

  private static canonicalizeLinkedIn(urlObj: URL): string {
    // Normalizes /posts/slug or /feed/update/urn:li:activity:...
    let path = urlObj.pathname;
    if (path.endsWith('/')) path = path.slice(0, -1);
    return `https://www.linkedin.com${path}`;
  }

  private static canonicalizeInstagram(urlObj: URL): string {
    // Matches /p/:id or /reel/:id or /reels/:id
    const match = urlObj.pathname.match(/\/(p|reel|reels|tv)\/([a-zA-Z0-9_-]+)/i);
    if (match) {
      const type = match[1].toLowerCase() === 'reels' ? 'reel' : match[1].toLowerCase();
      return `https://www.instagram.com/${type}/${match[2]}/`;
    }
    return this.normalize(urlObj);
  }

  private static canonicalizeFacebook(urlObj: URL): string {
    if (urlObj.hostname.includes('fb.watch')) {
      return this.normalize(urlObj);
    }
    return this.normalize(urlObj);
  }

  private static canonicalizeTikTok(urlObj: URL): string {
    const match = urlObj.pathname.match(/@([a-zA-Z0-9_.-]+)\/video\/(\d+)/i);
    if (match) {
      return `https://www.tiktok.com/@${match[1]}/video/${match[2]}`;
    }
    return this.normalize(urlObj);
  }
}
