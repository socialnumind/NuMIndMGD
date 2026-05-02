const http    = require('http');
const https   = require('https');
const fs      = require('fs');
const path    = require('path');
const cluster = require('cluster');
const os      = require('os');

try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8')
    .split('\n').forEach(line => {
      const [key, ...val] = line.split('=');
      if (key && val.length) process.env[key.trim()] = val.join('=').trim();
    });
} catch (_) {}

const PORT           = process.env.PORT           || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT || '12',    10);
const REQ_TIMEOUT_MS = parseInt(process.env.REQ_TIMEOUT_MS || '90000', 10);

if (!OPENAI_API_KEY) {
  console.error('❌  OPENAI_API_KEY is not set. Add it to your .env file or environment variables.');
  process.exit(1);
}
if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(`✅  Primary ${process.pid} — spawning ${numCPUs} worker(s) on :${PORT}`);

  /* ── Cluster-wide rate limit store (lives only in primary) ──────────
     Workers send { type:'RL_CHECK', key, now } and receive back
     { type:'RL_RESULT', allowed, retryAfter }.  Because the primary is
     single-threaded and JS is single-threaded, the Map read-modify-write
     is atomic — no race conditions.
  ──────────────────────────────────────────────────────────────────── */
  const _RL_WINDOW_MS  = parseInt(process.env.RATE_WINDOW_MS  || '60000', 10);
  const _RL_MAX_REQS   = parseInt(process.env.RATE_MAX_REQS   || '5',     10);
  const _rlMap = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [k, ts] of _rlMap) {
      const fresh = ts.filter(t => now - t < _RL_WINDOW_MS);
      if (fresh.length === 0) _rlMap.delete(k);
      else                    _rlMap.set(k, fresh);
    }
  }, 5 * 60 * 1000);

  cluster.on('message', (worker, msg) => {
    if (!msg || msg.type !== 'RL_CHECK') return;
    const { key, now } = msg;
    const ts = (_rlMap.get(key) || []).filter(t => now - t < _RL_WINDOW_MS);
    if (ts.length >= _RL_MAX_REQS) {
      const retryAfter = Math.ceil((ts[0] + _RL_WINDOW_MS - now) / 1000);
      worker.send({ type: 'RL_RESULT', reqId: msg.reqId, allowed: false, retryAfter: Math.max(retryAfter, 1) });
    } else {
      ts.push(now);
      _rlMap.set(key, ts);
      worker.send({ type: 'RL_RESULT', reqId: msg.reqId, allowed: true, retryAfter: 0 });
    }
  });
  for (let i = 0; i < numCPUs; i++) cluster.fork();

  let _primaryShuttingDown = false;
  cluster.on('exit', (worker, code) => {
    if (_primaryShuttingDown) {
      console.log(`[Primary] Worker ${worker.process.pid} exited during shutdown (code ${code})`);
      // If all workers have exited, exit the primary cleanly.
      if (Object.keys(cluster.workers).length === 0) process.exit(0);
      return;
    }
    console.warn(`⚠️  Worker ${worker.process.pid} exited (code ${code}) — restarting`);
    cluster.fork(); // auto-restart so one crash doesn't kill the app
  });

  // Forward SIGTERM/SIGINT to all workers so they drain gracefully.
  function _shutdownPrimary(signal) {
    if (_primaryShuttingDown) return;
    _primaryShuttingDown = true;
    console.log(`[Primary] ${signal} received — forwarding to workers`);
    for (const id in cluster.workers) {
      try { cluster.workers[id].process.kill(signal); } catch (_) {}
    }
    // Hard cap so the primary can't hang forever waiting on a stuck worker.
    setTimeout(() => {
      console.warn('[Primary] forcing exit after timeout');
      process.exit(1);
    }, 20000).unref();
  }
  process.on('SIGTERM', () => _shutdownPrimary('SIGTERM'));
  process.on('SIGINT',  () => _shutdownPrimary('SIGINT'));
  return;
}

const SESSION_ID_MAX_LEN = parseInt(process.env.SESSION_ID_MAX_LEN || '64', 10);
// NOTE: RATE_WINDOW_MS / RATE_MAX_REQS are now read only by the primary
// process (see cluster.on('message') above). Workers communicate via IPC.

/* ── IPC-based cluster-wide rate limiter (worker side) ──────────────
   Sends a RL_CHECK message to the primary and resolves with the result.
   Because Node's IPC is async, all callers of checkRateLimit() must await it.
   A unique reqId ties each request/response pair so concurrent inflight
   checks don't cross-wire.
──────────────────────────────────────────────────────────────────── */
let _rlReqCounter = 0;
const _rlPending  = new Map(); // reqId → { resolve }

process.on('message', (msg) => {
  if (!msg || msg.type !== 'RL_RESULT') return;
  const p = _rlPending.get(msg.reqId);
  if (p) { _rlPending.delete(msg.reqId); p.resolve(msg); }
});

function _rateLimitKey(req) {
  const raw = (req.headers['x-session-id'] || '').trim();
  if (raw && raw.length <= SESSION_ID_MAX_LEN && /^[A-Za-z0-9\-]+$/.test(raw)) {
    return { key: 'sid:' + raw, type: 'session' };
  }
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
           || req.socket.remoteAddress
           || 'unknown';
  return { key: 'ip:' + ip, type: 'ip' };
}

function checkRateLimit(req) {
  const { key, type } = _rateLimitKey(req);
  const reqId = ++_rlReqCounter;
  return new Promise((resolve) => {
    _rlPending.set(reqId, { resolve });
    if (typeof process.send !== 'function') {
      // Running without cluster (e.g. `node server.js` directly in dev).
      // Allow all requests — no rate limit in single-process mode.
      _rlPending.delete(reqId);
      resolve({ allowed: true, retryAfter: 0, key, type });
      return;
    }
    process.send({ type: 'RL_CHECK', reqId, key, now: Date.now() });
    // Safety timeout — if primary never replies (shouldn't happen), allow
    // the request rather than hanging forever.
    setTimeout(() => {
      if (_rlPending.has(reqId)) {
        _rlPending.delete(reqId);
        console.warn('[RateLimit] IPC timeout for reqId', reqId, '— allowing request');
        resolve({ allowed: true, retryAfter: 0, key, type });
      }
    }, 500);
  }).then(msg => ({ ...msg, key, type }));
}
const openaiAgent = new https.Agent({
  keepAlive:      true,
  maxSockets:     MAX_CONCURRENT, 
  maxFreeSockets: 4,
  timeout:        REQ_TIMEOUT_MS,
});

const crypto = require('crypto');

/* ════════════════════════════════════════════════════════════════════
   Local SQLite database — replaces Google Drive/Sheets and Supabase.
   The file lives at js/numind.db (override via SQLITE_PATH env var).
   See js/db.js for schema and the public API.
════════════════════════════════════════════════════════════════════ */
const _localDb = require('./db.js');

/* ════════════════════════════════════════════════════════════════════
   POST /api/save-registration
   Replaces the old Supabase-backed registration save. Called by the
   client immediately after the student fills out the registration form.
   Body: { student, sessionId }
════════════════════════════════════════════════════════════════════ */
async function _handleSaveRegistration(req, res) {
  const rl = await checkRateLimit(req);
  if (!rl.allowed) {
    res.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfter) });
    return res.end(JSON.stringify({
      error: `Too many registration requests. Please wait ${rl.retryAfter} second(s) and try again.`,
    }));
  }

  const MAX_BODY_BYTES = 64 * 1024;
  const chunks = [];
  let bodyBytes = 0;
  let aborted = false;
  req.on('data', c => {
    if (aborted) return;
    bodyBytes += c.length;
    if (bodyBytes > MAX_BODY_BYTES) {
      aborted = true;
      if (!res.headersSent) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Request body too large.' }));
      }
      req.destroy();
      return;
    }
    chunks.push(c);
  });
  req.on('end', () => {
    if (aborted || res.writableEnded) return;
    let body;
    try { body = JSON.parse(Buffer.concat(chunks).toString()); }
    catch (_) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid JSON' }));
    }

    const { student, sessionId } = body || {};
    if (!student || typeof student !== 'object' || !sessionId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Missing student or sessionId' }));
    }

    // Sanity-cap field lengths so a malformed client can't bloat the DB.
    const trim = (v, n = 200) => (v == null ? '' : String(v).slice(0, n));
    const sanitisedStudent = {
      firstName:   trim(student.firstName),
      lastName:    trim(student.lastName),
      fullName:    trim(student.fullName),
      class:       trim(student.class, 32),
      section:     trim(student.section, 32),
      school:      trim(student.school),
      schoolState: trim(student.schoolState, 64),
      schoolCity:  trim(student.schoolCity, 64),
      age:         trim(student.age, 8),
      gender:      trim(student.gender, 32),
      email:       trim(student.email),
    };

    try {
      _localDb.saveRegistration(sanitisedStudent, trim(sessionId, 64));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      console.error('[DB] save-registration error:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}

/* ════════════════════════════════════════════════════════════════════
   POST /api/save-report
   Called once the AI/fallback report has rendered. Persists registration
   (idempotent), all four module assessments + scores, and the full
   report text in one DB transaction.
   Body: { sessionId, student, assessments, report }
════════════════════════════════════════════════════════════════════ */
async function _handleSaveReport(req, res) {
  const rl = await checkRateLimit(req);
  if (!rl.allowed) {
    res.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfter) });
    return res.end(JSON.stringify({
      error: `Too many save requests. Please wait ${rl.retryAfter} second(s) and try again.`,
    }));
  }

  // The full payload (all answers + scores + 7 paragraphs of AI text) is
  // typically 30-80 KB. Cap at 1 MB to leave headroom.
  const MAX_BODY_BYTES = parseInt(process.env.MAX_REPORT_BODY_BYTES || String(1024 * 1024), 10);
  const chunks = [];
  let bodyBytes = 0;
  let aborted = false;
  req.on('data', c => {
    if (aborted) return;
    bodyBytes += c.length;
    if (bodyBytes > MAX_BODY_BYTES) {
      aborted = true;
      if (!res.headersSent) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Report payload too large.' }));
      }
      req.destroy();
      return;
    }
    chunks.push(c);
  });
  req.on('end', () => {
    if (aborted || res.writableEnded) return;
    let body;
    try { body = JSON.parse(Buffer.concat(chunks).toString()); }
    catch (_) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid JSON' }));
    }

    const { sessionId, student, assessments, report } = body || {};
    if (!sessionId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Missing sessionId' }));
    }

    try {
      _localDb.saveReport({
        sessionId: String(sessionId).slice(0, 64),
        student,
        assessments,
        report,
      });
      console.log(`[DB] ✅  Report + assessments saved for ${sessionId}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      console.error('[DB] save-report error:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}

const CACHE_TTL_MS     = parseInt(process.env.CACHE_TTL_MS     || String(24 * 60 * 60 * 1000), 10);
const CACHE_MAX_ENTRIES = parseInt(process.env.CACHE_MAX_ENTRIES || '500', 10);
const _reportCache = new Map();

function _cacheKey(rawPayload) {
  try {
    const parsed = JSON.parse(rawPayload.toString());
    const msgs   = parsed.messages || [];
    const scored = msgs.map(m => {
      if (m.role !== 'user' || typeof m.content !== 'string') return m;
      const normalised = m.content.replace(/STUDENT:.*?\n/, 'STUDENT: [REDACTED]\n');
      return { role: m.role, content: normalised };
    });
    return crypto
      .createHash('sha256')
      .update(JSON.stringify({ model: parsed.model, msgs: scored }))
      .digest('hex');
  } catch (_) {
    return null; // unparseable payload → skip cache
  }
}

function _extractNamesFromPayload(rawPayload) {
  try {
    const parsed = JSON.parse(rawPayload.toString());
    const msgs   = parsed.messages || [];
    for (const m of msgs) {
      if (m.role !== 'user' || typeof m.content !== 'string') continue;
      const studentMatch = m.content.match(/^STUDENT:\s*(.+?),\s*Class\s/m);
      if (!studentMatch) continue;
      const fullName  = studentMatch[1].trim();
      const firstMatch = m.content.match(/Use\s+(\S+?)'s name naturally throughout/);
      const firstName  = firstMatch ? firstMatch[1].trim() : fullName.split(' ')[0];

      return { firstName, fullName };
    }
    return null;
  } catch (_) {
    return null;
  }
}

function _anonymiseBody(jsonText, firstName, fullName) {
  if (!firstName && !fullName) return jsonText;
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  let out = jsonText;
  if (fullName)  out = out.replace(new RegExp('\\b' + escRe(fullName)  + '\\b', 'g'), '__FULL_NAME__');
  if (firstName) out = out.replace(new RegExp('\\b' + escRe(firstName) + '\\b', 'g'), '__FIRST_NAME__');
  return out;
}

function _cacheGet(key) {
  if (!key) return null;
  const entry = _reportCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { _reportCache.delete(key); return null; }
  return entry.body;
}

function _cacheSet(key, body) {
  if (!key) return;
  // LRU eviction: delete oldest entry when at capacity.
  if (_reportCache.size >= CACHE_MAX_ENTRIES) {
    _reportCache.delete(_reportCache.keys().next().value);
  }
  _reportCache.set(key, { body, ts: Date.now() });
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of _reportCache) {
    if (now - v.ts > CACHE_TTL_MS) _reportCache.delete(k);
  }
}, 60 * 60 * 1000);

/* ── Single unified job queue (replaces the previous dual-queue design) ─────
   The old code had two separate concurrency trackers: requestQueue /
   activeRequests (HTTP layer) and jobQueue / activeJobs (OpenAI layer).
   They both capped at MAX_CONCURRENT but tracked independently, so under
   load a job could be refused by the inner queue while the outer layer
   thought there was room — and vice-versa. Now there is one queue.
   MAX_QUEUE_SIZE env var controls total waiting capacity.
─────────────────────────────────────────────────────────────────────────── */
const MAX_ACTIVE      = parseInt(process.env.MAX_CONCURRENT || '12', 10); // re-use existing env var
const MAX_JOB_RETRIES = 2;
let   activeJobs = 0;
const jobQueue   = [];
const MAX_JOB_QUEUE = parseInt(process.env.MAX_JOB_QUEUE || '150', 10);

function callOpenAI(payload) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.openai.com',
      path:     '/v1/chat/completions',
      method:   'POST',
      agent:    openaiAgent,
      timeout:  REQ_TIMEOUT_MS,
      headers: {
        'Content-Type':   'application/json',
        'Authorization':  `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': payload.length,
        'Connection':     'keep-alive',
      },
    };

    const proxyReq = https.request(options, proxyRes => resolve({ proxyRes, payload }));
    proxyReq.on('timeout', () => {
      proxyReq.destroy();
      reject(new Error('OpenAI request timed out'));
    });
    proxyReq.on('error', err => reject(err));
    proxyReq.write(payload);
    proxyReq.end();
  });
}

async function processJob(payload, retries = MAX_JOB_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await callOpenAI(payload);
      return result;
    } catch (err) {
      const isLast = attempt === retries;
      console.warn(`[JobQueue] Attempt ${attempt + 1}/${retries + 1} failed: ${err.message}${isLast ? ' — giving up' : ' — retrying'}`);
      if (isLast) throw err;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}

function processQueue() {
  while (jobQueue.length > 0 && activeJobs < MAX_ACTIVE) {
    const item = jobQueue.shift();
    if (!item) break; // safety guard
    const { job, resolve, reject } = item;
    activeJobs++;
    if (activeJobs % 5 === 0) {
      console.log(`[JobQueue] active=${activeJobs}/${MAX_ACTIVE} queued=${jobQueue.length}`);
    }
    processJob(job)
      .then(result => {
        resolve(result);
      })
      .catch(err => {
        console.error(`[JobQueue] Job failed after retries: ${err.message}`);
        reject(err);
      })
      .finally(() => {
        activeJobs--; // release slot
        console.log(
          `[JobQueue] Done — active=${activeJobs}/${MAX_ACTIVE} queued=${jobQueue.length}`
        );
        processQueue(); // immediately process next job
      });
  }
}
function addJob(payload) {
  return new Promise((resolve, reject) => {

    if (jobQueue.length >= MAX_JOB_QUEUE) {
      console.warn(`[JobQueue] FULL (${jobQueue.length}/${MAX_JOB_QUEUE}) — rejecting job`);
      reject(new Error('Job queue full'));
      return;
    }
    console.log(`[JobQueue] Job added — active=${activeJobs}/${MAX_ACTIVE} queued=${jobQueue.length + 1}`);
    jobQueue.push({ job: payload, resolve, reject });
    processQueue();
  });
}
const _fileCache = new Map();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
};

/* ── Inject window._APP_TOKEN into HTML at serve time ───────────────
   The client needs the APP_SECRET to send as X-App-Token on every
   /api/* call. We inject it as a tiny inline <script> just before
   </head> so it's available before any module code runs.
   HTML is never cached in _fileCache (already no-cache) so the
   injection doesn't need to be invalidated on secret rotation.
   If APP_SECRET is not set, the placeholder is injected as an empty
   string — the server's auth guard is skipped in that case too.
────────────────────────────────────────────────────────────────────*/
function _injectToken(htmlBuffer) {
  const token = process.env.APP_SECRET || '';
  // Escape the token for safe JS string literal embedding.
  // APP_SECRET is a hex string (openssl rand -hex 32) so this is
  // defensive only — no quotes or special chars expected.
  const safeToken = token.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const injection = `<script>window._APP_TOKEN='${safeToken}';</script>`;
  const html = htmlBuffer.toString('utf8');
  const patched = html.replace('</head>', injection + '</head>');
  return Buffer.from(patched, 'utf8');
}

function serveStatic(filePath, res, req) {
  const ext    = path.extname(filePath).toLowerCase();
  const isHtml = ext === '.html';
  const ct     = MIME[ext] || 'text/plain';

  // ── Non-HTML: serve from memory cache with ETags ──────────────
  if (!isHtml && _fileCache.has(filePath)) {
    const { data, etag } = _fileCache.get(filePath);
    if (req && req.headers['if-none-match'] === etag) {
      res.writeHead(304, { 'ETag': etag, 'Cache-Control': 'public, max-age=3600' });
      res.end();
      return;
    }
    res.writeHead(200, { 'Content-Type': ct, 'ETag': etag, 'Cache-Control': 'public, max-age=3600' });
    res.end(data);
    return;
  }

  fs.readFile(filePath, (err, rawData) => {
    if (err) { res.writeHead(404); res.end(path.basename(filePath) + ' not found'); return; }

    if (isHtml) {
      // ── HTML: inject token, never cache in memory, send no-cache ──
      const data = _injectToken(rawData);
      res.writeHead(200, { 'Content-Type': ct, 'Cache-Control': 'no-cache, no-store' });
      res.end(data);
      return;
    }

    // ── Non-HTML: cache and serve with ETag ───────────────────────
    const etag = '"' + rawData.length + '-' + crypto.createHash('md5').update(rawData).digest('hex').slice(0, 8) + '"';
    _fileCache.set(filePath, { data: rawData, etag });
    if (req && req.headers['if-none-match'] === etag) {
      res.writeHead(304, { 'ETag': etag, 'Cache-Control': 'public, max-age=3600' });
      res.end();
      return;
    }
    res.writeHead(200, { 'Content-Type': ct, 'ETag': etag, 'Cache-Control': 'public, max-age=3600' });
    res.end(rawData);
  });
}

function runProxyRequest(payload, req, res) {
  if (res.writableEnded || !req.socket?.readable) {
    return;
  }

  const cacheKey = _cacheKey(payload);
  let   isStream = false;
  try { isStream = !!JSON.parse(payload.toString()).stream; } catch (_) {}

  if (cacheKey) {
    const cached = _cacheGet(cacheKey);
    if (cached) {
      console.log(`[Cache] HIT  key=${cacheKey.slice(0, 12)}... size=${_reportCache.size} stream=${isStream}`);
      res.writeHead(200, {
        'Content-Type':   'application/json',
        'Cache-Control':  'no-cache',
        'X-Cache':        'HIT',
        'Content-Length': String(cached.length),
      });
      res.end(cached);
      return;
    }
    console.log(`[Cache] MISS key=${cacheKey.slice(0, 12)}... size=${_reportCache.size}`);
  }

  addJob(payload)
    .then(({ proxyRes }) => {
      if (res.writableEnded) return;
      handleProxyResponse(proxyRes, res, req, payload, cacheKey, isStream);
    })
    .catch(err => {
      if (res.writableEnded) return;
      if (err.message === 'Job queue full' || err.message === 'Server busy') {
        if (!res.headersSent) res.writeHead(429, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          error: { message: 'Server busy. Please retry shortly.' },
        }));
      }
      console.error('[Proxy Error]', err.message);
      if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'Failed to reach OpenAI: ' + err.message } }));
    });
} 
function handleProxyResponse(proxyRes, res, req, payload, cacheKey, isStream) {
  const status = proxyRes.statusCode;
  proxyRes.setTimeout(REQ_TIMEOUT_MS, () => {
    console.warn('[Proxy] proxyRes stalled — destroying socket');
    proxyRes.destroy();
    if (!res.writableEnded) res.end();
  });

  const forwardHeaders = {
    'Content-Type':      isStream ? 'text/event-stream' : 'application/json',
    'Cache-Control':     'no-cache',
    'X-Accel-Buffering': 'no',
    'Connection':        'keep-alive',
    'X-Cache':           'MISS',
  };
  [
    'retry-after',
    'x-ratelimit-limit-requests',  'x-ratelimit-remaining-requests',
    'x-ratelimit-limit-tokens',    'x-ratelimit-remaining-tokens',
    'x-ratelimit-reset-requests',  'x-ratelimit-reset-tokens',
  ].forEach(k => { if (proxyRes.headers[k]) forwardHeaders[k] = proxyRes.headers[k]; });

  res.writeHead(status, forwardHeaders);

  if (isStream) {
    const sseChunks = [];
    proxyRes.on('data', chunk => {
      if (!res.writableEnded) res.write(chunk);
      sseChunks.push(chunk);
    });
    proxyRes.on('end', () => {
      if (!res.writableEnded) res.end();
      if (status === 200 && cacheKey) {
        try {
          const raw = Buffer.concat(sseChunks).toString('utf8');
          let accumulated = '';
          for (const line of raw.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const sseData = line.slice(6).trim();
            if (sseData === '[DONE]') break;
            try {
              const parsed = JSON.parse(sseData);
              accumulated += parsed?.choices?.[0]?.delta?.content || '';
            } catch (_) {}
          }
          if (accumulated) {
            const names       = _extractNamesFromPayload(payload);
            const anonText    = _anonymiseBody(accumulated, names && names.firstName, names && names.fullName);
            const syntheticBody = JSON.stringify({
              choices: [{ message: { content: anonText } }],
              _cached: true,
            });
            _cacheSet(cacheKey, Buffer.from(syntheticBody));
            console.log(`[Cache] SET  key=${cacheKey.slice(0, 12)}… (from stream, anonymised: fn=${names && names.firstName})`);
          }
        } catch (_) { /* best-effort — never crash the response */ }
      }
    });
    proxyRes.on('error', err => {
      console.error('[Stream Error]', err.message);
      if (!res.writableEnded) res.end();
    });
    req.on('close', () => { if (!proxyRes.destroyed) proxyRes.destroy(); });
  } else {
    const parts = [];
    proxyRes.on('data', c => parts.push(c));
    proxyRes.on('end', () => {
      const body = Buffer.concat(parts);
      if (status === 200 && cacheKey) {
        const names       = _extractNamesFromPayload(payload);
        const anonText    = _anonymiseBody(body.toString('utf8'), names && names.firstName, names && names.fullName);
        _cacheSet(cacheKey, Buffer.from(anonText, 'utf8'));
        console.log(`[Cache] SET  key=${cacheKey.slice(0, 12)}… (anonymised: fn=${names && names.firstName})`);
      }
      if (!res.writableEnded) res.end(body);
    });
  }
}
const server = http.createServer((req, res) => {

  req.setTimeout(REQ_TIMEOUT_MS, () => {
    if (!res.headersSent) res.writeHead(504, { 'Content-Type': 'application/json' });
    if (!res.writableEnded) res.end(JSON.stringify({ error: { message: 'Request timed out.' } }));
  });

  // ── API authentication ─────────────────────────────────────────
  // All /api/* routes require X-App-Token to match APP_SECRET env var.
  // Set APP_SECRET in your .env to any long random string (e.g. openssl rand -hex 32).
  // If APP_SECRET is not set, auth is skipped (dev mode — log a warning).
  if (req.url.startsWith('/api/')) {
    const APP_SECRET = process.env.APP_SECRET;
    if (APP_SECRET) {
      const token = req.headers['x-app-token'] || '';
      if (token !== APP_SECRET) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Unauthorized' }));
      }
    } else {
      // Only warn once per worker per startup
      if (!server._authWarnLogged) {
        console.warn('[Auth] ⚠️  APP_SECRET not set — /api/* routes are unprotected. Set APP_SECRET in .env before deploying.');
        server._authWarnLogged = true;
      }
    }
  }

  if (req.method === 'POST' && req.url === '/api/save-registration') {
    return _handleSaveRegistration(req, res);
  }

  if (req.method === 'POST' && req.url === '/api/save-report') {
    return _handleSaveReport(req, res);
  }

  if (req.method === 'POST' && req.url === '/api/ai-report') {

    // Body-size guard: protects against memory-exhaustion attacks where a
    // client streams gigabytes. The legit prompts are well under 100 KB.
    const MAX_BODY_BYTES = parseInt(process.env.MAX_BODY_BYTES || String(512 * 1024), 10);
    const chunks = [];
    let bodyBytes = 0;
    let aborted = false;
    req.on('data', chunk => {
      if (aborted) return;
      bodyBytes += chunk.length;
      if (bodyBytes > MAX_BODY_BYTES) {
        aborted = true;
        if (!res.headersSent) {
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: { message: 'Request body too large.' } }));
        }
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', async () => {
      if (aborted || res.writableEnded) return;
      const payload = Buffer.concat(chunks);

      // ── Cache-first short-circuit ──────────────────────────────
      // Cache hits cost nothing — don't charge them against the rate
      // limit. This matters for kiosk/lab networks where many students
      // share an IP and may regenerate identical reports.
      let cacheKey = null;
      try { cacheKey = _cacheKey(payload); } catch (_) {}
      if (cacheKey) {
        const cached = _cacheGet(cacheKey);
        if (cached) {
          console.log(`[Cache] HIT (pre-RL) key=${cacheKey.slice(0, 12)}... size=${_reportCache.size}`);
          res.writeHead(200, {
            'Content-Type':   'application/json',
            'Cache-Control':  'no-cache',
            'X-Cache':        'HIT',
            'Content-Length': String(cached.length),
          });
          return res.end(cached);
        }
      }

      // ── Rate limit (only on cache miss) ────────────────────────
      const rl = await checkRateLimit(req);
      if (!rl.allowed) {
        res.writeHead(429, {
          'Content-Type': 'application/json',
          'Retry-After':  String(rl.retryAfter),
        });
        res.end(JSON.stringify({
          error: {
            message: `Too many report requests. Please wait ${rl.retryAfter} second(s) and try again.`,
            retryAfter: rl.retryAfter,
          },
        }));
        console.warn(`[RateLimit] ${rl.type}=${rl.key} blocked. Retry in ${rl.retryAfter}s`);
        return;
      }

      // ── Dispatch into unified job queue ──────────────────────
      // addJob enforces MAX_ACTIVE concurrency and MAX_JOB_QUEUE depth.
      // No separate HTTP-layer slot counter needed.
      if (jobQueue.length >= MAX_JOB_QUEUE) {
        res.writeHead(429, {
          'Content-Type': 'application/json',
          'Retry-After':  '30',
          'X-Queue-Depth': String(jobQueue.length),
        });
        res.end(JSON.stringify({
          error: { message: 'Server is busy. Queue is full — please wait a moment and try again.' },
          queueDepth: jobQueue.length,
          maxQueue:   MAX_JOB_QUEUE,
        }));
        console.warn(`[Queue] FULL (${jobQueue.length}/${MAX_JOB_QUEUE}) — hard-rejected (worker ${process.pid})`);
      } else {
        runProxyRequest(payload, req, res);
      }
    });
    return;
  }
  if (req.method === 'GET') {
  const urlPath = req.url.split('?')[0];

  // ── Health check — no auth required ──────────────────────────
  if (urlPath === '/health' || urlPath === '/ready') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, pid: process.pid, ts: Date.now() }));
  }

  const cleanPath = urlPath === '/' ? '/index.html' : urlPath;
  const ext = path.extname(cleanPath).toLowerCase();

  // ── Explicitly block database files ──────────────────────────
  const BLOCKED_EXTS = new Set(['.db', '.sqlite', '.sqlite3']);
  const BLOCKED_NAMES = new Set(['numind.db-shm', 'numind.db-wal']);
  const basename = path.basename(cleanPath);
  if (BLOCKED_EXTS.has(ext) || BLOCKED_NAMES.has(basename)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  const allowed = ['.html', '.css', '.js', '.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const candidate = allowed.includes(ext)
    ? path.join(__dirname, cleanPath)
    : path.join(__dirname, 'index.html');

  const resolved = path.resolve(candidate);
  if (!resolved.startsWith(path.resolve(__dirname) + path.sep) &&
      resolved !== path.resolve(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  serveStatic(resolved, res, req);
  return;
}  // closes if (req.method === 'GET')

  res.writeHead(405);
  res.end('Method Not Allowed');
});  // closes http.createServer(...)

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅  Worker ${process.pid} listening on 0.0.0.0:${PORT}`);
  // Warn if SQLite is on the default (ephemeral) path — critical on Render free tier.
  if (!process.env.SQLITE_PATH) {
    console.warn('[DB] ⚠️  SQLITE_PATH not set — database will be written to the app directory.');
    console.warn('[DB] ⚠️  On Render free tier this path is EPHEMERAL and wiped on each deploy.');
    console.warn('[DB] ⚠️  Add a Render Persistent Disk mounted at /data and set SQLITE_PATH=/data/numind.db');
  }
});

/* ── Graceful shutdown ────────────────────────────────────────────────
   On SIGTERM/SIGINT (rolling deploys, container stop, Ctrl-C) we stop
   accepting new connections and give in-flight requests up to
   GRACEFUL_TIMEOUT_MS to finish. After that we forcibly exit so the
   process manager can replace us. The cluster primary auto-spawns a
   replacement worker in the meantime.
─────────────────────────────────────────────────────────────────────*/
let _shuttingDown = false;
function _gracefulShutdown(signal) {
  if (_shuttingDown) return;
  _shuttingDown = true;
  const GRACEFUL_TIMEOUT_MS = parseInt(process.env.GRACEFUL_TIMEOUT_MS || '15000', 10);
  console.log(`[Worker ${process.pid}] ${signal} received — draining (timeout ${GRACEFUL_TIMEOUT_MS}ms)`);

  // Stop accepting new connections; existing ones finish naturally.
  server.close(err => {
    if (err) console.error(`[Worker ${process.pid}] server.close error:`, err.message);
    try { _localDb.close(); } catch (_) {}
    console.log(`[Worker ${process.pid}] drained — exiting cleanly`);
    process.exit(0);
  });

  // Hard cap — if a slow OpenAI stream is still going at this point, bail.
  setTimeout(() => {
    console.warn(`[Worker ${process.pid}] graceful timeout — forcing exit (active=${activeJobs}, queued=${jobQueue.length})`);
    process.exit(1);
  }, GRACEFUL_TIMEOUT_MS).unref();
}
process.on('SIGTERM', () => _gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => _gracefulShutdown('SIGINT'));

// Last-ditch crash net — log and let the cluster primary respawn us.
// Without this, an unhandled rejection silently terminates the worker
// in newer Node versions.
process.on('unhandledRejection', err => {
  console.error(`[Worker ${process.pid}] unhandledRejection:`, err && err.stack || err);
});
process.on('uncaughtException', err => {
  console.error(`[Worker ${process.pid}] uncaughtException:`, err && err.stack || err);
  // Try to drain, then exit — primary will respawn.
  _gracefulShutdown('uncaughtException');
});
