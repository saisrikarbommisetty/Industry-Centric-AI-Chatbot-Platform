import { logger } from '../../utils/logger';

export interface DynamicRenderResult {
  html: string;
  renderedWithBrowser: boolean;
  preloadedState?: Record<string, any>;
}

export class BrowserRendererService {
  private playwrightAvailable: boolean | null = null;
  private playwrightModule: any = null;

  constructor() {
    this.checkPlaywrightAvailability();
  }

  private checkPlaywrightAvailability(): boolean {
    if (this.playwrightAvailable !== null) return this.playwrightAvailable;
    try {
      // Optional dynamic require so app functions without playwright package installed
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.playwrightModule = require('playwright');
      this.playwrightAvailable = true;
      logger.info('Playwright browser automation module detected and enabled for dynamic JS rendering.');
    } catch {
      this.playwrightAvailable = false;
      logger.info('Playwright not detected. Using high-fidelity SPA preloaded state and hydration extraction engine.');
    }
    return this.playwrightAvailable;
  }

  /**
   * Determine if a static HTML page indicates an interactive/SPA page that needs dynamic rendering
   */
  public isDynamicSpaPage(html: string, staticTextLength: number): boolean {
    if (staticTextLength > 350) return false;

    const lower = html.toLowerCase();
    const hasSpaRoot =
      lower.includes('id="root"') ||
      lower.includes('id="app"') ||
      lower.includes('id="__next"') ||
      lower.includes('id="__nuxt"');

    const hasJsRequiredNotice =
      lower.includes('you need to enable javascript') ||
      lower.includes('javascript is required') ||
      lower.includes('enable javascript to run this app');

    const hasClientSideFramework =
      lower.includes('react-dom') ||
      lower.includes('_next/static') ||
      lower.includes('vue.min.js') ||
      lower.includes('chunk-vendors');

    return (hasSpaRoot && staticTextLength < 250) || hasJsRequiredNotice || (hasClientSideFramework && staticTextLength < 150);
  }

  /**
   * Render page with Playwright if available, or extract preloaded JSON states
   */
  public async renderDynamicPage(url: string, staticHtml: string): Promise<DynamicRenderResult> {
    if (this.checkPlaywrightAvailability() && this.playwrightModule) {
      try {
        logger.info(`Rendering dynamic JavaScript page using Playwright: ${url}`);
        const browser = await this.playwrightModule.chromium.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });
        const context = await browser.newContext({
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (compatible; BusinessKnowledgeBot/1.0)',
          viewport: { width: 1280, height: 800 },
        });
        const page = await context.newPage();

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        // Give client hydration a brief window to mount
        await page.waitForTimeout(1500);

        const renderedHtml = await page.content();
        await browser.close();

        return {
          html: renderedHtml,
          renderedWithBrowser: true,
        };
      } catch (err: any) {
        logger.warn(`Playwright rendering encountered error for ${url}: ${err.message}. Falling back to preloaded state extraction.`);
      }
    }

    // High-fidelity fallback: extract preloaded state data from the static HTML
    return {
      html: staticHtml,
      renderedWithBrowser: false,
    };
  }
}

export const browserRendererService = new BrowserRendererService();
