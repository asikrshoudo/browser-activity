import type { BrowserInfo } from './activity';

const FIREFOX_BASED: { match: RegExp; info: BrowserInfo }[] = [
  { match: /^zen/i, info: { id: 'zen_browser', name: 'Zen Browser' } },
  { match: /^tor/i, info: { id: 'tor_browser', name: 'Tor Browser' } },
];

export function detectBrowser(): BrowserInfo {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox/')) return { id: 'firefox', name: 'Firefox' };
  if (ua.includes('Edg/')) return { id: 'microsoft_edge', name: 'Microsoft Edge' };
  return { id: 'chrome', name: 'Chrome' };
}

export async function detectBrowserExact(): Promise<BrowserInfo> {
  const base = detectBrowser();
  if (base.id !== 'firefox') return base;
  try {
    const runtime = browser.runtime as unknown as {
      getBrowserInfo?: () => Promise<{ name: string }>;
    };
    const name = (await runtime.getBrowserInfo?.())?.name;
    console.info('browser name:', name);
    return FIREFOX_BASED.find((entry) => entry.match.test(name ?? ''))?.info ?? base;
  } catch {
    return base;
  }
}
