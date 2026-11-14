/**
 * BRIM AI / Industry-Centric AI Chatbot
 * Universal Website Embed Widget Loader
 * 
 * Usage:
 * <script src="https://YOUR-DOMAIN/widget.js" data-assistant-id="YOUR-BOT-ID" async></script>
 */
(function () {
  'use strict';

  // Prevent duplicate initialization
  if (window.__BRIM_AI_WIDGET_INITIALIZED__) return;
  window.__BRIM_AI_WIDGET_INITIALIZED__ = true;

  // Find the host script tag and attributes
  const currentScript =
    document.currentScript ||
    document.querySelector('script[data-assistant-id]') ||
    document.querySelector('script[src*="widget.js"]');

  if (!currentScript) {
    console.warn('[Chatbot Widget] Embed script tag not found.');
    return;
  }

  const assistantId = currentScript.getAttribute('data-assistant-id') || 'prycoons-ai';
  const position = currentScript.getAttribute('data-position') || 'right'; // 'right' | 'left'
  const primaryColor = currentScript.getAttribute('data-color') || '#0f766e'; // Default teal / brand color
  const scriptUrl = currentScript.src || window.location.href;

  let hostOrigin = '';
  try {
    hostOrigin = new URL(scriptUrl).origin;
  } catch (e) {
    hostOrigin = window.location.origin;
  }

  const chatUrl = `${hostOrigin}/chat/${encodeURIComponent(assistantId)}?embed=true`;

  // Inject Styles
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .brim-chat-widget-launcher {
      position: fixed;
      bottom: 24px;
      ${position === 'left' ? 'left: 24px;' : 'right: 24px;'}
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${primaryColor};
      color: #ffffff;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.22), 0 2px 6px rgba(0, 0, 0, 0.12);
      cursor: pointer;
      z-index: 2147483646;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      outline: none;
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
      -webkit-tap-highlight-color: transparent;
    }
    .brim-chat-widget-launcher:hover {
      transform: scale(1.06);
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.28);
    }
    .brim-chat-widget-launcher:active {
      transform: scale(0.95);
    }
    .brim-chat-widget-launcher svg {
      width: 28px;
      height: 28px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      transition: transform 0.2s ease, opacity 0.2s ease;
    }
    .brim-chat-widget-container {
      position: fixed;
      bottom: 96px;
      ${position === 'left' ? 'left: 24px;' : 'right: 24px;'}
      width: 420px;
      max-width: calc(100vw - 32px);
      height: 640px;
      max-height: calc(100vh - 120px);
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.08);
      z-index: 2147483647;
      overflow: hidden;
      border: 1px solid rgba(0, 0, 0, 0.08);
      display: none;
      opacity: 0;
      transform: translateY(20px) scale(0.96);
      transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .brim-chat-widget-container.brim-open {
      display: block;
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    .brim-chat-widget-iframe {
      width: 100%;
      height: 100%;
      border: none;
      margin: 0;
      padding: 0;
      display: block;
    }
    @media (max-width: 480px) {
      .brim-chat-widget-container {
        top: 0;
        bottom: 0;
        left: 0 !0;
        right: 0 !important;
        width: 100vw !important;
        max-width: 100vw !important;
        height: 100vh !important;
        max-height: 100vh !important;
        border-radius: 0 !important;
        border: none !important;
      }
      .brim-chat-widget-container.brim-open {
        bottom: 0 !important;
      }
    }
  `;
  document.head.appendChild(styleEl);

  // SVG Icons
  const CHAT_ICON_SVG = `
    <svg viewBox="0 0 24 24">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `;
  const CLOSE_ICON_SVG = `
    <svg viewBox="0 0 24 24">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;

  // Create Launcher Button
  const launcherBtn = document.createElement('button');
  launcherBtn.className = 'brim-chat-widget-launcher';
  launcherBtn.setAttribute('aria-label', 'Open Chat Assistant');
  launcherBtn.innerHTML = CHAT_ICON_SVG;

  // Create Container
  const container = document.createElement('div');
  container.className = 'brim-chat-widget-container';

  let iframeLoaded = false;
  let isOpen = false;

  function loadIframeIfNeeded() {
    if (iframeLoaded) return;
    const iframe = document.createElement('iframe');
    iframe.className = 'brim-chat-widget-iframe';
    iframe.src = chatUrl;
    iframe.title = 'AI Chat Assistant';
    iframe.allow = 'microphone';
    container.appendChild(iframe);
    iframeLoaded = true;
  }

  function toggleWidget() {
    isOpen = !isOpen;
    if (isOpen) {
      loadIframeIfNeeded();
      container.style.display = 'block';
      // Force repaint before transition class
      void container.offsetWidth;
      container.classList.add('brim-open');
      launcherBtn.innerHTML = CLOSE_ICON_SVG;
      launcherBtn.setAttribute('aria-label', 'Close Chat Assistant');
    } else {
      container.classList.remove('brim-open');
      launcherBtn.innerHTML = CHAT_ICON_SVG;
      launcherBtn.setAttribute('aria-label', 'Open Chat Assistant');
      setTimeout(() => {
        if (!isOpen) {
          container.style.display = 'none';
        }
      }, 250);
    }
  }

  launcherBtn.addEventListener('click', toggleWidget);

  // Listen for message from iframe (e.g. close widget request)
  window.addEventListener('message', function (event) {
    if (event.data && (event.data.type === 'close-chat-widget' || event.data.type === 'brim-chat-close')) {
      if (isOpen) toggleWidget();
    }
  });

  // Append elements to DOM once ready
  function initDOM() {
    document.body.appendChild(container);
    document.body.appendChild(launcherBtn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDOM);
  } else {
    initDOM();
  }
})();

