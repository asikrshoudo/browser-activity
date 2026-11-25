export default defineBackground(() => {
  console.log('browser-activity background started', { id: browser.runtime.id });
});
