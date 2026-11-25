export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  main() {
    let last = '';

    function text(selector: string): string | undefined {
      return document.querySelector(selector)?.textContent?.trim() || undefined;
    }

    function videoId(): string | null {
      const url = new URL(location.href);
      if (url.pathname === '/watch') return url.searchParams.get('v');
      if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2] || null;
      return null;
    }

    function avatar(): string | undefined {
      const img = document.querySelector<HTMLImageElement>(
        'ytd-video-owner-renderer #avatar img, ytd-reel-video-renderer[is-active] #channel-info img',
      );
      const src = img?.src;
      if (!src || !src.startsWith('https://')) return undefined;
      const large = src.replace(/=s\d+/, '=s256');
      return large.length <= 256 ? large : undefined;
    }

    function report() {
      const id = videoId();
      if (!id) return;

      const title =
        text('ytd-watch-metadata h1') ??
        text('ytd-reel-video-renderer[is-active] h2') ??
        document.title.replace(/ - YouTube$/, '');
      const channel =
        text('ytd-video-owner-renderer #channel-name a') ??
        text('ytd-reel-video-renderer[is-active] ytd-channel-name a');
      if (!title || !channel) return;

      const media = { videoId: id, title, channel, avatar: avatar() };
      const key = JSON.stringify(media);
      if (key === last) return;
      last = key;
      browser.runtime.sendMessage({ type: 'media', media }).catch(() => {});
    }

    window.addEventListener('yt-navigate-finish', report);
    setInterval(report, 2000);
    report();
  },
});
