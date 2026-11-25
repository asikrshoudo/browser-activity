export interface BrowserInfo {
  id: string;
  name: string;
}

export interface YouTubeMedia {
  videoId: string;
  title: string;
  channel: string;
  avatar?: string;
}

const ACTIVITY_TYPE_PLAYING = 0;
const ACTIVITY_TYPE_WATCHING = 3;
const STATUS_DISPLAY_DETAILS = 2;

const SCROLLING_SITES = [
  { domain: 'facebook.com', name: 'Facebook' },
  { domain: 'instagram.com', name: 'Instagram' },
];

function isDomain(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

function clip(text: string, max = 128): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function favicon(host: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
}

export function youtubeVideoId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '');
  if (!isDomain(host, 'youtube.com')) return null;
  if (url.pathname === '/watch') return url.searchParams.get('v');
  if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2] || null;
  return null;
}

export function buildActivity(rawUrl: string, browser: BrowserInfo, media?: YouTubeMedia) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  const host = url.hostname.replace(/^www\./, '');
  const small = { small_image: browser.id, small_text: browser.name };

  const videoId = youtubeVideoId(url);
  if (videoId) {
    const current = media?.videoId === videoId ? media : undefined;
    return {
      name: 'YouTube',
      type: ACTIVITY_TYPE_WATCHING,
      details: clip(current?.title ?? 'YouTube'),
      state: current ? clip(current.channel) : undefined,
      assets: {
        large_image: current?.avatar ?? favicon('youtube.com'),
        large_text: current?.channel,
        ...small,
      },
      buttons: [{ label: 'Watch Video', url: `https://www.youtube.com/watch?v=${videoId}` }],
    };
  }

  const site = SCROLLING_SITES.find((s) => isDomain(host, s.domain));
  return {
    type: ACTIVITY_TYPE_PLAYING,
    status_display_type: STATUS_DISPLAY_DETAILS,
    details: clip(site ? `Scrolling ${site.name}` : `Browsing ${host}`),
    assets: { large_image: favicon(host), large_text: host, ...small },
  };
}
