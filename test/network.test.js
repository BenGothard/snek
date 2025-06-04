import test from 'node:test';
import { strictEqual, deepStrictEqual } from 'node:assert';
import http from 'node:http';
import { loadRemoteConfig } from '../remote_config.js';
import { loadAsset } from '../asset_loader.js';
import { loadUnsentScores, saveUnsentScores, flushUnsentScores } from '../scores.js';

globalThis.localStorage = (() => {
  let store = {};
  return {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v);
    },
    removeItem: k => {
      delete store[k];
    },
    clear: () => {
      store = {};
    }
  };
})();

function startServer(handler) {
  const server = http.createServer(handler);
  return new Promise(resolve => {
    server.listen(0, () => {
      const { port } = server.address();
      resolve({ server, url: `http://localhost:${port}` });
    });
  });
}

test('missing asset triggers download', async t => {
  const { server, url } = await startServer((req, res) => {
    if (req.url === '/remote/eat.mp3') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('remote');
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  const blob = await loadAsset('eat.mp3', `${url}/remote`, `${url}/local`);
  const txt = await blob.text();
  strictEqual(txt, 'remote');
  server.close();
});

test('remote config merges defaults', async t => {
  const { server, url } = await startServer((req, res) => {
    res.end(JSON.stringify({ HIGH_SCORE_API_URL: 'http://remote/api' }));
  });
  const cfg = await loadRemoteConfig({ HIGH_SCORE_API_URL: 'default', ASSET_BASE_URL: '' }, `${url}`);
  deepStrictEqual(cfg.HIGH_SCORE_API_URL, 'http://remote/api');
  server.close();
});

test('high-score submission stored when offline', async t => {
  saveUnsentScores([{ name: 't', score: 1 }]);
  await flushUnsentScores('http://localhost:1').catch(() => {});
  strictEqual(loadUnsentScores().length, 1);
});

