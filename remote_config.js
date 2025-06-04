import { fetchWithRetry } from './http_client.js';

export async function loadRemoteConfig(defaults = {}, urlOverride) {
  const url =
    urlOverride ||
    (typeof process !== 'undefined' && process.env && process.env.REMOTE_CONFIG_URL) ||
    (typeof window !== 'undefined' && window.REMOTE_CONFIG_URL);
  if (!url) return defaults;
  try {
    const res = await fetchWithRetry(url, { timeout: 5000 });
    const remote = await res.json();
    return { ...defaults, ...remote };
  } catch (e) {
    console.warn('Failed to load remote config', e);
    return defaults;
  }
}
