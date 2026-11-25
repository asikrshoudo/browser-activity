import { buildActivity, type YouTubeMedia } from '@/utils/activity';
import { detectBrowser, detectBrowserExact } from '@/utils/browser';

const HOST = 'com.asikrshoudo.browser_activity';

export default defineBackground(() => {
  let info = detectBrowser();
  const media = new Map<number, YouTubeMedia>();
  let port: ReturnType<typeof browser.runtime.connectNative> | null = null;
  let last = '';

  function connect() {
    const next = browser.runtime.connectNative(HOST);
    next.onMessage.addListener((message: { type?: string; error?: string }) => {
      if (message?.type === 'error') console.warn('host:', message.error);
    });
    next.onDisconnect.addListener(() => {
      const reason = browser.runtime.lastError?.message;
      if (reason) console.warn('host disconnected:', reason);
      port = null;
      last = '';
    });
    port = next;
    return next;
  }

  function send(message: object) {
    const payload = JSON.stringify(message);
    if (payload === last) return;
    last = payload;
    (port ?? connect()).postMessage(message);
  }

  async function update() {
    const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
    const current = tab?.id === undefined ? undefined : media.get(tab.id);
    const activity = tab?.url ? buildActivity(tab.url, info, current) : null;
    send(activity ? { type: 'activity', activity } : { type: 'clear' });
  }

  browser.tabs.onActivated.addListener(update);
  browser.tabs.onUpdated.addListener((_id, change) => {
    if (change.url || change.status === 'complete') update();
  });
  browser.tabs.onRemoved.addListener((id) => media.delete(id));
  browser.windows.onFocusChanged.addListener(update);

  browser.runtime.onMessage.addListener((message, sender) => {
    if (message?.type === 'media' && sender.tab?.id !== undefined) {
      media.set(sender.tab.id, message.media);
      update();
    }
  });

  detectBrowserExact().then((exact) => {
    info = exact;
    update();
  });
});
