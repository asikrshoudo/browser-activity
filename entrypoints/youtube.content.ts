export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  main() {
    let last = '';

    function channelName(): string | undefined {
      const selectors = [
        'ytd-video-owner-renderer #channel-name a',
        'ytd-reel-video-renderer[is-active] ytd-channel-name a',
      ];
      for (const selector of selectors) {
        const text = document.querySelector(selector)?.textContent?.trim();
        if (text) return text;
      }
      return undefined;
    }

    function report() {
      const channel = channelName();
      if (!channel) return;
      const key = `${location.href}|${channel}`;
      if (key === last) return;
      last = key;
      browser.runtime.sendMessage({ type: 'channel', channel }).catch(() => {});
    }

    window.addEventListener('yt-navigate-finish', report);
    setInterval(report, 2000);
    report();
  },
});
