/**
 * Ittisalo Omnichannel Live Chat Widget
 * Official client embed script
 * https://ittisalo.com
 * (c) Ittisalo CRM
 */
(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.__ITTISALO_WIDGET_INITIALIZED__) return;
  window.__ITTISALO_WIDGET_INITIALIZED__ = true;

  // 1. Detect Script Tag & Configuration
  var currentScript = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && scripts[i].src.indexOf('widget.js') !== -1) {
        return scripts[i];
      }
    }
    return scripts[scripts.length - 1];
  })();

  var tenantId = currentScript ? currentScript.getAttribute('data-tenant-id') : null;
  var forcedPosition = currentScript ? currentScript.getAttribute('data-position') : null;

  if (!tenantId) {
    console.warn('[Ittisalo Widget] Missing required data-tenant-id attribute on script tag.');
    return;
  }

  // Derive API host from script URL (supports localhost, app.ittisalo.com, ittisalo.com)
  var scriptSrc = currentScript ? currentScript.src : '';
  var apiBase = '';
  try {
    var parsedUrl = new URL(scriptSrc, window.location.href);
    apiBase = parsedUrl.origin;
  } catch (e) {
    apiBase = window.location.origin;
  }

  // Visitor identification & session storage keys
  var STORAGE_PREFIX = 'ittisalo_';
  var STORAGE_KEY_VID = STORAGE_PREFIX + 'vid_' + tenantId;
  var STORAGE_KEY_CID = STORAGE_PREFIX + 'cid_' + tenantId;
  var STORAGE_KEY_LEAD = STORAGE_PREFIX + 'lead_' + tenantId;

  function getStorage(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function setStorage(key, val) {
    try { localStorage.setItem(key, val); } catch (e) {}
  }

  var visitorId = getStorage(STORAGE_KEY_VID);
  if (!visitorId) {
    visitorId = 'vid_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
    setStorage(STORAGE_KEY_VID, visitorId);
  }

  var conversationId = getStorage(STORAGE_KEY_CID);
  var savedLead = null;
  try {
    savedLead = JSON.parse(getStorage(STORAGE_KEY_LEAD) || 'null');
  } catch (_) {}

  // 2. State & Config Variables
  var config = {
    enabled: true,
    businessName: 'Ittisalo Support',
    avatarUrl: '',
    primaryColor: '#dc2626',
    headerTitle: 'Chat with us',
    subheading: 'Typically replies in minutes',
    welcomeMessage: 'Hi there! How can we help you today?',
    position: forcedPosition || 'bottom-right',
    showWhatsappButton: true,
    whatsappNumber: '',
    showInstagramButton: true,
    instagramHandle: '',
    requireLeadForm: true,
    leadFields: ['name', 'phone']
  };

  var isOpen = false;
  var messages = [];
  var unreadCount = 0;
  var pollInterval = null;
  var isSending = false;

  // 3. Create Host Container with Shadow DOM for complete CSS isolation
  var hostElement = document.createElement('div');
  hostElement.id = 'ittisalo-chat-widget-root';
  document.body.appendChild(hostElement);

  var shadowRoot = hostElement.attachShadow({ mode: 'open' });

  // 4. Inject Styles into Shadow DOM
  var styleSheet = document.createElement('style');
  styleSheet.textContent = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    .ittisalo-widget-wrap {
      position: fixed;
      bottom: 24px;
      z-index: 9999999;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      pointer-events: auto;
    }
    .ittisalo-widget-wrap.pos-right {
      right: 24px;
      align-items: flex-end;
    }
    .ittisalo-widget-wrap.pos-left {
      left: 24px;
      align-items: flex-start;
    }

    /* Proactive greeting bubble */
    .ittisalo-greeting-card {
      background: #ffffff;
      color: #1f2937;
      border-radius: 14px;
      padding: 12px 16px;
      margin-bottom: 12px;
      max-width: 280px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
      font-size: 13.5px;
      line-height: 1.45;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      border: 1px solid rgba(0, 0, 0, 0.06);
      animation: ittisaloSlideUp 0.3s ease-out;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .ittisalo-greeting-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
    }
    .ittisalo-greeting-close {
      cursor: pointer;
      opacity: 0.5;
      padding: 2px;
      margin-left: auto;
    }
    .ittisalo-greeting-close:hover {
      opacity: 1;
    }

    /* Launcher Button */
    .ittisalo-launcher-btn {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: none;
      background: var(--ittisalo-primary, #dc2626);
      color: #ffffff;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
      position: relative;
    }
    .ittisalo-launcher-btn:hover {
      transform: scale(1.06);
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.28);
    }
    .ittisalo-launcher-btn svg {
      width: 28px;
      height: 28px;
      fill: currentColor;
      transition: transform 0.2s ease;
    }

    /* Badge */
    .ittisalo-unread-badge {
      position: absolute;
      top: -3px;
      right: -3px;
      background: #ef4444;
      color: #ffffff;
      border: 2px solid #ffffff;
      font-size: 11px;
      font-weight: 700;
      border-radius: 10px;
      padding: 1px 6px;
      min-width: 18px;
      text-align: center;
    }

    /* Chat Window Container */
    .ittisalo-chat-box {
      width: 380px;
      max-width: calc(100vw - 32px);
      height: 580px;
      max-height: calc(100vh - 110px);
      background: #ffffff;
      border-radius: 18px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18), 0 2px 10px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      margin-bottom: 14px;
      border: 1px solid rgba(0, 0, 0, 0.07);
      animation: ittisaloPopup 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      transform-origin: bottom right;
    }
    .pos-left .ittisalo-chat-box {
      transform-origin: bottom left;
    }

    /* Header */
    .ittisalo-header {
      background: var(--ittisalo-primary, #dc2626);
      color: #ffffff;
      padding: 16px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      position: relative;
    }
    .ittisalo-header-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 18px;
      color: #ffffff;
      overflow: hidden;
      flex-shrink: 0;
      border: 2px solid rgba(255, 255, 255, 0.3);
    }
    .ittisalo-header-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .ittisalo-header-meta {
      flex: 1;
      overflow: hidden;
    }
    .ittisalo-header-name {
      font-size: 15px;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      letter-spacing: -0.2px;
    }
    .ittisalo-header-status {
      font-size: 12px;
      opacity: 0.9;
      display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 2px;
    }
    .ittisalo-status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #22c55e;
      display: inline-block;
      box-shadow: 0 0 6px #22c55e;
    }
    .ittisalo-header-close {
      background: transparent;
      border: none;
      color: #ffffff;
      opacity: 0.8;
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      display: flex;
    }
    .ittisalo-header-close:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.15);
    }

    /* Omnichannel Quick Action Bar */
    .ittisalo-quick-channels {
      background: #f9fafb;
      border-bottom: 1px solid #f1f3f5;
      padding: 8px 14px;
      display: flex;
      gap: 8px;
    }
    .ittisalo-channel-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 7px 10px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      border: 1px solid rgba(0, 0, 0, 0.06);
      transition: background 0.15s;
    }
    .ittisalo-btn-wa {
      background: #eefcf3;
      color: #15803d;
      border-color: #bbf7d0;
    }
    .ittisalo-btn-wa:hover {
      background: #dcfce7;
    }
    .ittisalo-btn-ig {
      background: #fdf2f8;
      color: #be185d;
      border-color: #fbcfe8;
    }
    .ittisalo-btn-ig:hover {
      background: #fce7f3;
    }

    /* Pre-Chat Lead Capture Form */
    .ittisalo-lead-form {
      padding: 24px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      flex: 1;
      background: #ffffff;
      overflow-y: auto;
    }
    .ittisalo-lead-intro {
      font-size: 14px;
      color: #374151;
      line-height: 1.4;
      font-weight: 500;
      margin-bottom: 4px;
    }
    .ittisalo-field-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .ittisalo-field-label {
      font-size: 12px;
      font-weight: 600;
      color: #4b5563;
    }
    .ittisalo-field-input {
      width: 100%;
      padding: 10px 12px;
      border-radius: 9px;
      border: 1.5px solid #e5e7eb;
      font-size: 13.5px;
      outline: none;
      transition: border-color 0.15s;
    }
    .ittisalo-field-input:focus {
      border-color: var(--ittisalo-primary, #dc2626);
    }
    .ittisalo-submit-btn {
      margin-top: 8px;
      padding: 12px;
      border-radius: 10px;
      border: none;
      background: var(--ittisalo-primary, #dc2626);
      color: #ffffff;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .ittisalo-submit-btn:hover {
      opacity: 0.92;
    }

    /* Messages Area */
    .ittisalo-messages-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #fafafa;
    }
    .ittisalo-msg-row {
      display: flex;
      flex-direction: column;
      max-width: 82%;
    }
    .ittisalo-msg-row.from-visitor {
      align-self: flex-end;
      align-items: flex-end;
    }
    .ittisalo-msg-row.from-agent {
      align-self: flex-start;
      align-items: flex-start;
    }
    .ittisalo-msg-bubble {
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 13.5px;
      line-height: 1.45;
      word-break: break-word;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    .from-visitor .ittisalo-msg-bubble {
      background: var(--ittisalo-primary, #dc2626);
      color: #ffffff;
      border-bottom-right-radius: 3px;
    }
    .from-agent .ittisalo-msg-bubble {
      background: #ffffff;
      color: #1f2937;
      border-bottom-left-radius: 3px;
      border: 1px solid rgba(0, 0, 0, 0.06);
    }
    .ittisalo-msg-time {
      font-size: 10.5px;
      color: #9ca3af;
      margin-top: 3px;
      padding: 0 4px;
    }

    /* Typing Indicator */
    .ittisalo-typing-row {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 12px;
      background: #ffffff;
      border-radius: 14px;
      align-self: flex-start;
      border: 1px solid rgba(0, 0, 0, 0.06);
      font-size: 12px;
      color: #6b7280;
    }
    .ittisalo-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #9ca3af;
      animation: ittisaloBounce 1.2s infinite ease-in-out;
    }
    .ittisalo-dot:nth-child(2) { animation-delay: 0.2s; }
    .ittisalo-dot:nth-child(3) { animation-delay: 0.4s; }

    /* Input Footer */
    .ittisalo-chat-footer {
      border-top: 1px solid #f1f3f5;
      background: #ffffff;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ittisalo-input-textarea {
      flex: 1;
      border: none;
      resize: none;
      height: 38px;
      max-height: 100px;
      font-size: 13.5px;
      outline: none;
      color: #1f2937;
      padding: 8px 4px;
      font-family: inherit;
    }
    .ittisalo-send-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: var(--ittisalo-primary, #dc2626);
      color: #ffffff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.15s, transform 0.15s;
      flex-shrink: 0;
    }
    .ittisalo-send-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      transform: none;
    }
    .ittisalo-send-btn:not(:disabled):hover {
      transform: scale(1.05);
    }
    .ittisalo-send-btn svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }

    /* Brand Watermark */
    .ittisalo-brand-badge {
      text-align: center;
      padding: 5px 0 6px;
      font-size: 11px;
      color: #9ca3af;
      background: #ffffff;
      border-top: 1px solid #f9fafb;
    }
    .ittisalo-brand-badge a {
      color: #6b7280;
      text-decoration: none;
      font-weight: 600;
    }
    .ittisalo-brand-badge a:hover {
      text-decoration: underline;
    }

    /* Animations */
    @keyframes ittisaloPopup {
      from { opacity: 0; transform: scale(0.9) translateY(14px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes ittisaloSlideUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes ittisaloBounce {
      0%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-5px); }
    }

    /* Mobile view optimizations */
    @media (max-width: 480px) {
      .ittisalo-widget-wrap {
        bottom: 16px;
      }
      .ittisalo-widget-wrap.pos-right { right: 16px; }
      .ittisalo-widget-wrap.pos-left { left: 16px; }
      .ittisalo-chat-box {
        width: calc(100vw - 32px);
        height: calc(100vh - 90px);
      }
    }
  `;
  shadowRoot.appendChild(styleSheet);

  // 5. Build Widget DOM
  var wrap = document.createElement('div');
  wrap.className = 'ittisalo-widget-wrap pos-right';
  shadowRoot.appendChild(wrap);

  // Greeting Bubble
  var greetingCard = document.createElement('div');
  greetingCard.className = 'ittisalo-greeting-card';
  greetingCard.style.display = 'none';
  greetingCard.innerHTML = `
    <span class="ittisalo-greeting-text"></span>
    <span class="ittisalo-greeting-close">&times;</span>
  `;
  wrap.appendChild(greetingCard);

  // Chat Box
  var chatBox = document.createElement('div');
  chatBox.className = 'ittisalo-chat-box';
  chatBox.style.display = 'none';
  wrap.appendChild(chatBox);

  // Launcher Button
  var launcherBtn = document.createElement('button');
  launcherBtn.className = 'ittisalo-launcher-btn';
  launcherBtn.setAttribute('aria-label', 'Open live chat');
  launcherBtn.innerHTML = `
    <svg class="icon-chat" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/></svg>
    <svg class="icon-close" style="display:none;" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
    <span class="ittisalo-unread-badge" style="display:none;">0</span>
  `;
  wrap.appendChild(launcherBtn);

  // 6. Fetch Configuration & Render
  function fetchConfig() {
    fetch(apiBase + '/api/widget/config?tenantId=' + encodeURIComponent(tenantId))
      .then(function(res) {
        if (!res.ok) throw new Error('Config failed with status ' + res.status);
        return res.json();
      })
      .then(function(data) {
        if (!data || data.enabled === false) {
          hostElement.style.display = 'none';
          return;
        }

        // Apply config
        config = Object.assign(config, data);

        // Apply primary color CSS variable
        hostElement.style.setProperty('--ittisalo-primary', config.primaryColor || '#dc2626');

        // Position
        if (config.position === 'bottom-left') {
          wrap.className = 'ittisalo-widget-wrap pos-left';
        } else {
          wrap.className = 'ittisalo-widget-wrap pos-right';
        }

        // Show proactive greeting after 3 seconds if not opened
        setTimeout(function() {
          if (!isOpen && config.welcomeMessage) {
            greetingCard.querySelector('.ittisalo-greeting-text').textContent = config.welcomeMessage;
            greetingCard.style.display = 'flex';
          }
        }, 2500);

        renderChatBox();

        // If conversation already restored, fetch initial messages
        if (conversationId) {
          pollMessages();
        }
      })
      .catch(function(err) {
        console.warn('[Ittisalo Widget] Failed to load config:', err);
      });
  }

  // 7. Render Chat Box Layout
  function renderChatBox() {
    var avatarHtml = config.avatarUrl 
      ? '<img src="' + config.avatarUrl + '" alt="' + config.businessName + '" />' 
      : (config.businessName.charAt(0) || 'I');

    var waButtonHtml = (config.showWhatsappButton && config.whatsappNumber) 
      ? '<a href="https://wa.me/' + config.whatsappNumber + '?text=Hi,%20I%20have%20an%20inquiry" target="_blank" rel="noopener" class="ittisalo-channel-btn ittisalo-btn-wa">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>' +
        'WhatsApp</a>' 
      : '';

    var igButtonHtml = (config.showInstagramButton && config.instagramHandle)
      ? '<a href="https://instagram.com/' + config.instagramHandle + '" target="_blank" rel="noopener" class="ittisalo-channel-btn ittisalo-btn-ig">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4z"/></svg>' +
        'Instagram</a>'
      : '';

    var channelsBarHtml = (waButtonHtml || igButtonHtml)
      ? '<div class="ittisalo-quick-channels">' + waButtonHtml + igButtonHtml + '</div>'
      : '';

    // Decide whether to show Lead Form or Live Chat
    var needsLeadForm = config.requireLeadForm && !savedLead && !conversationId;

    chatBox.innerHTML = `
      <div class="ittisalo-header">
        <div class="ittisalo-header-avatar">${avatarHtml}</div>
        <div class="ittisalo-header-meta">
          <div class="ittisalo-header-name">${escapeHtml(config.businessName)}</div>
          <div class="ittisalo-header-status">
            <span class="ittisalo-status-dot"></span>
            ${escapeHtml(config.subheading || 'Online now')}
          </div>
        </div>
        <button class="ittisalo-header-close" aria-label="Close chat">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
      ${channelsBarHtml}
      <div class="ittisalo-content-container" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
        <!-- Filled dynamically -->
      </div>
      <div class="ittisalo-brand-badge">
        Powered by <a href="https://ittisalo.com" target="_blank" rel="noopener">Ittisalo</a>
      </div>
    `;

    // Hook Close Button
    chatBox.querySelector('.ittisalo-header-close').onclick = toggleWidget;

    var container = chatBox.querySelector('.ittisalo-content-container');
    if (needsLeadForm) {
      renderLeadForm(container);
    } else {
      renderChatInterface(container);
    }
  }

  // 8. Render Pre-Chat Lead Form
  function renderLeadForm(container) {
    container.innerHTML = `
      <div class="ittisalo-lead-form">
        <div class="ittisalo-lead-intro">
          👋 Welcome! Please share your details to connect with us immediately:
        </div>
        <div class="ittisalo-field-group">
          <label class="ittisalo-field-label">Your Name</label>
          <input type="text" class="ittisalo-field-input input-name" placeholder="John Doe" required />
        </div>
        <div class="ittisalo-field-group">
          <label class="ittisalo-field-label">WhatsApp Number / Phone</label>
          <input type="tel" class="ittisalo-field-input input-phone" placeholder="+92 300 1234567" required />
        </div>
        <div class="ittisalo-field-group">
          <label class="ittisalo-field-label">Email (Optional)</label>
          <input type="email" class="ittisalo-field-input input-email" placeholder="john@example.com" />
        </div>
        <button type="button" class="ittisalo-submit-btn">Start Chat</button>
      </div>
    `;

    var submitBtn = container.querySelector('.ittisalo-submit-btn');
    submitBtn.onclick = function() {
      var name = container.querySelector('.input-name').value.trim();
      var phone = container.querySelector('.input-phone').value.trim();
      var email = container.querySelector('.input-email').value.trim();

      if (!name) {
        alert('Please enter your name.');
        return;
      }
      if (!phone) {
        alert('Please enter your phone number.');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Connecting...';

      var leadData = { name: name, phone: phone, email: email };
      savedLead = leadData;
      setStorage(STORAGE_KEY_LEAD, JSON.stringify(leadData));

      initSession(leadData, function(err) {
        submitBtn.disabled = false;
        if (err) {
          alert('Could not start session. Please try again.');
          return;
        }
        renderChatInterface(container);
      });
    };
  }

  // 9. Render Live Chat Interface
  function renderChatInterface(container) {
    container.innerHTML = `
      <div class="ittisalo-messages-body">
        <div class="ittisalo-msg-row from-agent">
          <div class="ittisalo-msg-bubble">${escapeHtml(config.welcomeMessage)}</div>
          <div class="ittisalo-msg-time">Just now</div>
        </div>
      </div>
      <div class="ittisalo-chat-footer">
        <textarea class="ittisalo-input-textarea" placeholder="Type a message..." rows="1"></textarea>
        <button class="ittisalo-send-btn" aria-label="Send message" disabled>
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    `;

    var textarea = container.querySelector('.ittisalo-input-textarea');
    var sendBtn = container.querySelector('.ittisalo-send-btn');
    var msgBody = container.querySelector('.ittisalo-messages-body');

    // Input state listener
    textarea.oninput = function() {
      sendBtn.disabled = !textarea.value.trim();
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    };

    textarea.onkeydown = function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    };

    sendBtn.onclick = sendMessage;

    function sendMessage() {
      var text = textarea.value.trim();
      if (!text || isSending) return;

      // Make sure session exists
      if (!conversationId) {
        initSession(savedLead, function(err) {
          if (!err) doSendMessage(text);
        });
      } else {
        doSendMessage(text);
      }
    }

    function doSendMessage(text) {
      isSending = true;
      sendBtn.disabled = true;
      textarea.value = '';
      textarea.style.height = '38px';

      // Optimistic append
      appendMessage('customer', text, new Date().toISOString());

      fetch(apiBase + '/api/widget/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenantId,
          conversationId: conversationId,
          content: text,
          visitorId: visitorId
        })
      })
      .then(function(res) { return res.json(); })
      .then(function(res) {
        isSending = false;
        sendBtn.disabled = false;
        // Schedule fast poll to pick up AI response
        setTimeout(pollMessages, 1500);
        setTimeout(pollMessages, 4000);
      })
      .catch(function(err) {
        console.error('[Ittisalo Widget] Send message error:', err);
        isSending = false;
        sendBtn.disabled = false;
      });
    }

    // Scroll to bottom
    msgBody.scrollTop = msgBody.scrollHeight;

    // Load message history if already have conversationId
    if (conversationId) {
      pollMessages();
    }
  }

  // 10. Session Initialization
  function initSession(leadData, callback) {
    var metadata = {
      url: window.location.href,
      referrer: document.referrer || '',
      userAgent: navigator.userAgent
    };

    fetch(apiBase + '/api/widget/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: tenantId,
        visitorId: visitorId,
        lead: leadData || null,
        metadata: metadata
      })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.conversationId) {
        conversationId = data.conversationId;
        setStorage(STORAGE_KEY_CID, conversationId);
        startPolling();
        callback(null, data);
      } else {
        callback(new Error(data.error || 'Failed to get conversationId'));
      }
    })
    .catch(function(err) {
      callback(err);
    });
  }

  // 11. Append Message to Body
  function appendMessage(senderType, content, createdAt) {
    var msgBody = shadowRoot.querySelector('.ittisalo-messages-body');
    if (!msgBody) return;

    var isVisitor = senderType === 'customer';
    var row = document.createElement('div');
    row.className = 'ittisalo-msg-row ' + (isVisitor ? 'from-visitor' : 'from-agent');

    var timeStr = 'Just now';
    try {
      var d = new Date(createdAt);
      timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (_) {}

    row.innerHTML = `
      <div class="ittisalo-msg-bubble">${escapeHtml(content)}</div>
      <div class="ittisalo-msg-time">${timeStr}</div>
    `;

    msgBody.appendChild(row);
    msgBody.scrollTop = msgBody.scrollHeight;
  }

  // 12. Message Polling & Synchronization
  function pollMessages() {
    if (!conversationId) return;

    fetch(apiBase + '/api/widget/messages?tenantId=' + encodeURIComponent(tenantId) + '&conversationId=' + encodeURIComponent(conversationId))
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (!data || !Array.isArray(data.messages)) return;

        var serverMsgs = data.messages;
        var msgBody = shadowRoot.querySelector('.ittisalo-messages-body');
        if (!msgBody) return;

        // Compare count or IDs to avoid wiping scroll position
        if (serverMsgs.length > messages.length) {
          // If we had new messages while closed, increase unread badge
          if (!isOpen && serverMsgs.length > messages.length) {
            var newCount = serverMsgs.length - messages.length;
            unreadCount += newCount;
            updateBadge();
          }

          messages = serverMsgs;
          rebuildMessageBody(msgBody, messages);
        }
      })
      .catch(function() {});
  }

  function rebuildMessageBody(container, msgs) {
    container.innerHTML = `
      <div class="ittisalo-msg-row from-agent">
        <div class="ittisalo-msg-bubble">${escapeHtml(config.welcomeMessage)}</div>
        <div class="ittisalo-msg-time">Welcome</div>
      </div>
    `;

    msgs.forEach(function(m) {
      appendMessage(m.sender_type, m.content, m.created_at);
    });
  }

  function startPolling() {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(pollMessages, 5000);
  }

  function updateBadge() {
    var badge = launcherBtn.querySelector('.ittisalo-unread-badge');
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }

  // 13. Toggle Widget Open / Close
  function toggleWidget() {
    isOpen = !isOpen;
    if (isOpen) {
      chatBox.style.display = 'flex';
      greetingCard.style.display = 'none';
      launcherBtn.querySelector('.icon-chat').style.display = 'none';
      launcherBtn.querySelector('.icon-close').style.display = 'block';
      unreadCount = 0;
      updateBadge();

      // Focus input if available
      var textarea = chatBox.querySelector('.ittisalo-input-textarea');
      if (textarea) setTimeout(function() { textarea.focus(); }, 150);

      // Scroll to bottom
      var msgBody = chatBox.querySelector('.ittisalo-messages-body');
      if (msgBody) msgBody.scrollTop = msgBody.scrollHeight;

      startPolling();
    } else {
      chatBox.style.display = 'none';
      launcherBtn.querySelector('.icon-chat').style.display = 'block';
      launcherBtn.querySelector('.icon-close').style.display = 'none';
    }
  }

  launcherBtn.onclick = toggleWidget;
  greetingCard.onclick = toggleWidget;
  greetingCard.querySelector('.ittisalo-greeting-close').onclick = function(e) {
    e.stopPropagation();
    greetingCard.style.display = 'none';
  };

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initialize
  fetchConfig();

})();
