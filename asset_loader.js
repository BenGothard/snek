import { fetchWithRetry } from './http_client.js';

export async function loadAsset(filename, remoteBase = '', localBase = 'assets') {
  const localUrl = `${localBase.replace(/\/$/, '')}/${filename}`;
  try {
    const res = await fetch(localUrl);
    if (res.ok) return await res.blob();
  } catch (_) {}
  if (remoteBase) {
    const remoteUrl = `${remoteBase.replace(/\/$/, '')}/${filename}`;
    const res = await fetchWithRetry(remoteUrl);
    return await res.blob();
  }
  throw new Error(`Unable to load asset ${filename}`);
}
