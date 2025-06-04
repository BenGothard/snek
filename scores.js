import { fetchWithRetry } from './http_client.js';

export async function loadOnlineLeaderboard(apiUrl) {
  const res = await fetchWithRetry(apiUrl);
  const data = await res.json();
  return data.scores || [];
}

export async function postScoreOnline(apiUrl, scoreData) {
  await fetchWithRetry(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scoreData)
  });
}

export function loadUnsentScores() {
  try {
    return JSON.parse(localStorage.getItem('unsentScores') || '[]');
  } catch {
    return [];
  }
}

export function saveUnsentScores(list) {
  localStorage.setItem('unsentScores', JSON.stringify(list));
}

export async function flushUnsentScores(apiUrl) {
  const pending = loadUnsentScores();
  if (!pending.length) return;
  for (const s of [...pending]) {
    try {
      await postScoreOnline(apiUrl, s);
      pending.shift();
    } catch (e) {
      break;
    }
  }
  saveUnsentScores(pending);
}
