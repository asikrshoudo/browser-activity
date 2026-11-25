import type { BrowserInfo } from './activity';

export function detectBrowser(): BrowserInfo {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox/')) return { id: 'firefox', name: 'Firefox' };
  if (ua.includes('Edg/')) return { id: 'edge', name: 'Edge' };
  if (ua.includes('OPR/')) return { id: 'opera', name: 'Opera' };
  return { id: 'chrome', name: 'Chrome' };
}
