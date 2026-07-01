const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 8787);
const DATA_DIR = process.env.LIVE_OPS_DATA_DIR || process.env.DATA_DIR || path.join(process.cwd(), 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'plump-events.jsonl');

const DEVICE_AUTH_SECRET = process.env.PLUMP_DEVICE_AUTH_SECRET || '';
const ADMIN_TOKEN = process.env.LIVE_OPS_ADMIN_TOKEN || '';
const APPLE_COMMISSION_RATE = Number(process.env.APPLE_COMMISSION_RATE || '0.15');

const PRICE_TABLE = {
  'plump.monthly': Number(process.env.PLUMP_MONTHLY_PRICE || '6.99'),
  'plump.annual': Number(process.env.PLUMP_ANNUAL_PRICE || '29.99'),
  'plump.lifetime': Number(process.env.PLUMP_LIFETIME_PRICE || '49.99'),
};

const EVENT_ALLOWLIST = new Set([
  'app_open',
  'onboarding_start',
  'card_generated',
  'paywall_shown',
  'trial_started',
  'purchase_completed',
  'lifetime_purchase_completed',
  'restore_completed',
]);

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(EVENTS_FILE)) fs.writeFileSync(EVENTS_FILE, '', 'utf8');
}

function sendJson(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 256000) {
        reject(new Error('body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function timingSafeEqualString(a, b) {
  const aa = Buffer.from(a || '', 'utf8');
  const bb = Buffer.from(b || '', 'utf8');
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function verifyDeviceSignature(req, rawBody) {
  if (!DEVICE_AUTH_SECRET) return false;

  const deviceId = String(req.headers['x-plump-device-id'] || '');
  const timestamp = String(req.headers['x-plump-timestamp'] || '');
  const signature = String(req.headers['x-plump-signature'] || '');

  if (!deviceId || !timestamp || !signature) return false;

  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) return false;

  const message = `${timestamp}.${deviceId}.${rawBody}`;
  const expected = crypto.createHmac('sha256', DEVICE_AUTH_SECRET).update(message).digest('hex');
  return timingSafeEqualString(signature, expected);
}

function isAdmin(req, parsedUrl) {
  if (!ADMIN_TOKEN) return false;
  const headerToken = String(req.headers['x-live-ops-token'] || '');
  const queryToken = parsedUrl.searchParams.get('token') || '';
  return timingSafeEqualString(headerToken, ADMIN_TOKEN) || timingSafeEqualString(queryToken, ADMIN_TOKEN);
}

function normalizeProps(props) {
  const safe = {};
  if (!props || typeof props !== 'object') return safe;

  for (const [key, value] of Object.entries(props)) {
    if (!['string', 'number', 'boolean'].includes(typeof value)) continue;
    safe[key.slice(0, 64)] = value;
  }

  return safe;
}

function appendEvents(deviceId, events) {
  ensureDataDir();
  const rows = [];

  for (const event of events || []) {
    if (!event || typeof event !== 'object') continue;

    const name = String(event.name || '');
    if (!EVENT_ALLOWLIST.has(name)) continue;

    const ts = new Date(event.ts || Date.now());
    if (Number.isNaN(ts.getTime())) continue;

    rows.push(JSON.stringify({
      ts: ts.toISOString(),
      receivedAt: new Date().toISOString(),
      deviceId,
      name,
      props: normalizeProps(event.props),
    }));
  }

  if (rows.length > 0) {
    fs.appendFileSync(EVENTS_FILE, rows.join('\n') + '\n', 'utf8');
  }

  return rows.length;
}

function loadEvents() {
  ensureDataDir();
  const raw = fs.readFileSync(EVENTS_FILE, 'utf8').trim();
  if (!raw) return [];

  return raw.split('\n')
    .map(line => {
      try { return JSON.parse(line); } catch { return null; }
    })
    .filter(Boolean);
}

function productIdForEvent(event) {
  const productId = String(event.props?.productId || '');
  if (PRICE_TABLE[productId] !== undefined) return productId;

  if (event.name === 'lifetime_purchase_completed') return 'plump.lifetime';
  if (event.name === 'trial_started') return 'plump.annual';
  if (event.name === 'purchase_completed') return 'plump.monthly';

  return '';
}

function planForProductId(productId) {
  if (productId === 'plump.monthly') return 'monthly';
  if (productId === 'plump.annual') return 'annual';
  if (productId === 'plump.lifetime') return 'lifetime';
  return 'unknown';
}

function startOfToday(now) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfWeek(now) {
  const day = now.getDay();
  const diff = (day + 6) % 7;
  const start = startOfToday(now);
  start.setDate(start.getDate() - diff);
  return start;
}

function startOfMonth(now) {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function summarize(events) {
  const now = new Date();
  const today = startOfToday(now);
  const week = startOfWeek(now);
  const month = startOfMonth(now);

  const installs = new Set();
  const onboardingStarted = new Set();
  const onboardingCompleted = new Set();
  const paywallSeen = new Set();
  const converted = new Map();

  const installSources = {};
  const conversionsByPlan = { monthly: 0, annual: 0, lifetime: 0, unknown: 0 };

  const revenue = {
    todayGross: 0,
    weekGross: 0,
    monthGross: 0,
    todayNet: 0,
    weekNet: 0,
    monthNet: 0,
  };

  const conversionRows = [];

  for (const event of events) {
    const ts = new Date(event.ts);
    if (Number.isNaN(ts.getTime())) continue;

    const deviceId = event.deviceId || 'unknown';
    const source = String(event.props?.installSource || event.props?.source || 'unknown');

    if (event.name === 'app_open') {
      installs.add(deviceId);
      installSources[source] = (installSources[source] || 0) + 1;
    }

    if (event.name === 'onboarding_start') onboardingStarted.add(deviceId);
    if (event.name === 'card_generated') onboardingCompleted.add(deviceId);
    if (event.name === 'paywall_shown') paywallSeen.add(deviceId);

    const isConversion =
      event.name === 'purchase_completed' ||
      event.name === 'lifetime_purchase_completed' ||
      event.name === 'trial_started';

    if (isConversion) {
      const productId = productIdForEvent(event);
      const plan = planForProductId(productId);
      converted.set(deviceId, { plan, productId, ts: event.ts });
      conversionsByPlan[plan] = (conversionsByPlan[plan] || 0) + 1;

      const gross = PRICE_TABLE[productId] || 0;
      const net = gross * (1 - APPLE_COMMISSION_RATE);

      if (ts >= today) {
        revenue.todayGross += gross;
        revenue.todayNet += net;
      }
      if (ts >= week) {
        revenue.weekGross += gross;
        revenue.weekNet += net;
      }
      if (ts >= month) {
        revenue.monthGross += gross;
        revenue.monthNet += net;
      }

      conversionRows.push({ ts: event.ts, deviceId, plan, productId, gross, net });
    }
  }

  const convertedDevices = new Set(converted.keys());
  const completedNotConverted = [...onboardingCompleted].filter(deviceId => !convertedDevices.has(deviceId));
  const roundMoney = value => Math.round(value * 100) / 100;

  return {
    generatedAt: new Date().toISOString(),
    refreshSeconds: 30,
    appleCommissionRate: APPLE_COMMISSION_RATE,
    funnel: {
      installs: installs.size,
      onboardingStarted: onboardingStarted.size,
      onboardingCompleted: onboardingCompleted.size,
      paywallSeen: paywallSeen.size,
      converted: convertedDevices.size,
      onboardingCompletedNotConverted: completedNotConverted.length,
    },
    conversionsByPlan,
    installSources,
    revenue: {
      todayGross: roundMoney(revenue.todayGross),
      weekGross: roundMoney(revenue.weekGross),
      monthGross: roundMoney(revenue.monthGross),
      todayNet: roundMoney(revenue.todayNet),
      weekNet: roundMoney(revenue.weekNet),
      monthNet: roundMoney(revenue.monthNet),
    },
    recentConversions: conversionRows.slice(-25).reverse().map(row => ({
      ...row,
      gross: roundMoney(row.gross),
      net: roundMoney(row.net),
    })),
  };
}

function dashboardHtml(token) {
  const safeToken = String(token || '').replace(/"/g, '&quot;');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Plump Live Ops</title>
  <style>
    :root {
      --cream: #FBF4E9;
      --brown: #5A4632;
      --muted: #9C8B76;
      --green: #3F8C32;
      --border: #E6DACB;
      --white: #FFFFFF;
      --rose: #F2A6A0;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--cream);
      color: var(--brown);
      font-family: ui-rounded, "Nunito", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .wrap { max-width: 1180px; margin: 0 auto; padding: 28px; }
    .hero {
      display: flex; justify-content: space-between; align-items: center; gap: 16px;
      padding: 22px; border: 1px solid var(--border); border-radius: 28px;
      background: linear-gradient(135deg, #fffaf2, #f8ead7);
      box-shadow: 0 14px 32px rgba(90, 70, 50, 0.10);
    }
    h1 { margin: 0; font-size: 34px; letter-spacing: -0.03em; }
    .muted { color: var(--muted); }
    .pill { background: var(--green); color: white; border-radius: 999px; padding: 10px 14px; font-weight: 800; }
    .grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; margin-top: 18px; }
    .card {
      background: var(--white); border: 1px solid var(--border); border-radius: 22px; padding: 18px;
      box-shadow: 0 8px 22px rgba(90, 70, 50, 0.07);
    }
    .metric { font-size: 34px; font-weight: 900; margin-top: 6px; letter-spacing: -0.03em; }
    .label { color: var(--muted); font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
    .wide { grid-column: span 3; }
    .half { grid-column: span 3; }
    .third { grid-column: span 2; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    td, th { padding: 10px 8px; border-bottom: 1px solid var(--border); text-align: left; font-size: 14px; }
    th { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .06em; }
    .money { color: var(--green); }
    .error { background: #fff0ef; border-color: var(--rose); color: #8a2d25; }
    @media (max-width: 900px) {
      .grid { grid-template-columns: repeat(2, 1fr); }
      .wide, .half, .third { grid-column: span 2; }
      .hero { align-items: flex-start; flex-direction: column; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <section class="hero">
      <div>
        <h1>🐻 Plump Live Ops</h1>
        <div class="muted">Minimal funnel + revenue view. Auto-refreshes every 30 seconds.</div>
      </div>
      <div class="pill" id="status">Loading…</div>
    </section>

    <section class="grid">
      <div class="card third"><div class="label">Installs / Opens</div><div class="metric" id="installs">—</div></div>
      <div class="card third"><div class="label">Onboarding Started</div><div class="metric" id="started">—</div></div>
      <div class="card third"><div class="label">Onboarding Complete</div><div class="metric" id="completed">—</div></div>
      <div class="card third"><div class="label">Paywall Seen</div><div class="metric" id="paywall">—</div></div>
      <div class="card third"><div class="label">Converted</div><div class="metric" id="converted">—</div></div>
      <div class="card third"><div class="label">Completed Not Converted</div><div class="metric" id="notConverted">—</div></div>

      <div class="card third"><div class="label">Revenue Today Net</div><div class="metric money" id="todayNet">—</div></div>
      <div class="card third"><div class="label">Revenue Week Net</div><div class="metric money" id="weekNet">—</div></div>
      <div class="card third"><div class="label">Revenue Month Net</div><div class="metric money" id="monthNet">—</div></div>

      <div class="card half">
        <div class="label">Conversions by Plan</div>
        <table><tbody id="plans"></tbody></table>
      </div>

      <div class="card half">
        <div class="label">Install Source</div>
        <table><tbody id="sources"></tbody></table>
      </div>

      <div class="card wide">
        <div class="label">Recent Conversions</div>
        <table>
          <thead><tr><th>Time</th><th>Plan</th><th>Product</th><th>Net</th></tr></thead>
          <tbody id="recent"></tbody>
        </table>
      </div>
    </section>
  </div>

  <script>
    const token = "${safeToken}";
    const money = value => "£" + Number(value || 0).toFixed(2);

    function rowsFromObject(obj) {
      const entries = Object.entries(obj || {});
      if (!entries.length) return '<tr><td class="muted">No data yet</td><td></td></tr>';
      return entries.map(([k, v]) => '<tr><td>' + k + '</td><td><strong>' + v + '</strong></td></tr>').join('');
    }

    async function refresh() {
      const status = document.getElementById('status');
      try {
        const res = await fetch('/api/live-ops/summary?token=' + encodeURIComponent(token), { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();

        document.getElementById('installs').textContent = data.funnel.installs;
        document.getElementById('started').textContent = data.funnel.onboardingStarted;
        document.getElementById('completed').textContent = data.funnel.onboardingCompleted;
        document.getElementById('paywall').textContent = data.funnel.paywallSeen;
        document.getElementById('converted').textContent = data.funnel.converted;
        document.getElementById('notConverted').textContent = data.funnel.onboardingCompletedNotConverted;

        document.getElementById('todayNet').textContent = money(data.revenue.todayNet);
        document.getElementById('weekNet').textContent = money(data.revenue.weekNet);
        document.getElementById('monthNet').textContent = money(data.revenue.monthNet);

        document.getElementById('plans').innerHTML = rowsFromObject(data.conversionsByPlan);
        document.getElementById('sources').innerHTML = rowsFromObject(data.installSources);

        const recent = data.recentConversions || [];
        document.getElementById('recent').innerHTML = recent.length
          ? recent.map(row => '<tr><td>' + new Date(row.ts).toLocaleString() + '</td><td>' + row.plan + '</td><td>' + row.productId + '</td><td class="money">' + money(row.net) + '</td></tr>').join('')
          : '<tr><td class="muted">No conversions yet</td><td></td><td></td><td></td></tr>';

        status.textContent = 'Live · ' + new Date(data.generatedAt).toLocaleTimeString();
        status.className = 'pill';
      } catch (error) {
        status.textContent = 'Offline / auth failed';
        status.className = 'pill error';
      }
    }

    refresh();
    setInterval(refresh, 30000);
  </script>
</body>
</html>`;
}

async function handleRequest(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, X-Plump-Device-Id, X-Plump-Timestamp, X-Plump-Signature, X-Live-Ops-Token',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/health') {
    sendJson(res, 200, { ok: true, service: 'plump-live-ops' });
    return;
  }

  if (req.method === 'POST' && parsedUrl.pathname === '/api/v1/events') {
    const rawBody = await readBody(req);
    if (!verifyDeviceSignature(req, rawBody)) {
      sendJson(res, 401, { ok: false });
      return;
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      sendJson(res, 400, { ok: false, error: 'invalid json' });
      return;
    }

    const deviceId = String(req.headers['x-plump-device-id'] || 'unknown').slice(0, 128);
    const accepted = appendEvents(deviceId, payload.events);
    sendJson(res, 200, { ok: true, accepted });
    return;
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/api/live-ops/summary') {
    if (!isAdmin(req, parsedUrl)) {
      sendJson(res, 401, { ok: false });
      return;
    }

    sendJson(res, 200, summarize(loadEvents()));
    return;
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/ops') {
    if (!isAdmin(req, parsedUrl)) {
      res.writeHead(401, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Unauthorized');
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(dashboardHtml(parsedUrl.searchParams.get('token') || ''));
    return;
  }

  sendJson(res, 404, { ok: false, error: 'not found' });
}

ensureDataDir();

http.createServer((req, res) => {
  handleRequest(req, res).catch(error => {
    console.error(error);
    sendJson(res, 500, { ok: false });
  });
}).listen(PORT, () => {
  console.log(`Plump live ops listening on ${PORT}`);
});
