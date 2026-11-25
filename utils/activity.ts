export interface BrowserInfo {
  id: string;
  name: string;
}

const ACTIVITY_TYPE_PLAYING = 0;
const ACTIVITY_TYPE_WATCHING = 3;
const STATUS_DISPLAY_DETAILS = 2;

const SCROLLING_SITES = [
  { domain: 'facebook.com', key: 'facebook', name: 'Facebook' },
  { domain: 'instagram.com', key: 'instagram', name: 'Instagram' },
];

function isDomain(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

export function buildActivity(rawUrl: string, browser: BrowserInfo, channel?: string) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  const host = url.hostname.replace(/^www\./, '');
  const small = { small_image: browser.id, small_text: browser.name };

  const isYouTubeVideo =
    isDomain(host, 'youtube.com') &&
    (url.pathname === '/watch' || url.pathname.startsWith('/shorts/'));

  if (isYouTubeVideo) {
    return {
      type: ACTIVITY_TYPE_WATCHING,
      status_display_type: STATUS_DISPLAY_DETAILS,
      details: 'YouTube',
      state: channel?.slice(0, 128),
      assets: { large_image: 'youtube', ...small },
    };
  }

  const site = SCROLLING_SITES.find((s) => isDomain(host, s.domain));
  if (site) {
    return {
      type: ACTIVITY_TYPE_PLAYING,
      status_display_type: STATUS_DISPLAY_DETAILS,
      details: `Scrolling ${site.name}`,
      assets: { large_image: site.key, ...small },
    };
  }

  return {
    type: ACTIVITY_TYPE_PLAYING,
    status_display_type: STATUS_DISPLAY_DETAILS,
    details: `Browsing ${host}`.slice(0, 128),
    assets: { large_image: 'web', ...small },
  };
}
