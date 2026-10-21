(() => {
'use strict';

/* ---------------- demo data ---------------- */
const DAY = 864e5, YEAR = 365 * DAY;
const PRICE = 135.40;            // USD per KAU (1 KAU = 1 g gold)
const BAL0 = 12.6585;            // KAU balance
const LIFE0 = 112.62 / PRICE;    // lifetime earnings paid to date (KAU)
const TR0 = 858.97;              // total return (USD)
const T0 = Date.now();
const PL = [
  { id: 'p1', amount: 4.0, apy: 0.045, start: T0 - 38 * DAY, term: 90 },
  { id: 'p2', amount: 2.5, apy: 0.060, start: T0 - 12 * DAY, term: 180 },
];
const PLEDGED = PL.reduce((a, p) => a + p.amount, 0);
const sim = { t: T0, speed: 1, cur: 'kau' };

/* ---------------- accrual model ---------------- */
const mStart = t => { const d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), 1).getTime(); };
const mNext = t => { const d = new Date(t); return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime(); };
const acc = (p, t) => p.amount * p.apy * Math.min(Math.max(t - p.start, 0), p.term * DAY) / YEAR;
const isLive = (p, t) => t >= p.start && t < p.start + p.term * DAY;
const sum = f => PL.reduce((a, p) => a + f(p), 0);
const paid = t => sum(p => acc(p, mStart(t)) - acc(p, mStart(T0)));
const perMs = t => sum(p => isLive(p, t) ? p.amount * p.apy / YEAR : 0);

const V = {
  active: t => sum(p => acc(p, t) - acc(p, mStart(t))),
  lifetime: t => LIFE0 + paid(t),
  balance: t => BAL0 + paid(t),
  avail: t => BAL0 + paid(t) - PLEDGED,
  'balance.eff': t => BAL0 + paid(t) + V.active(t),
  projected: t => sum(p => acc(p, mNext(t)) - acc(p, mStart(t))),
  totalReturn: t => TR0 / PRICE + paid(t) + V.active(t),
  'rate.hour': t => perMs(t) * 36e5,
  'rate.day': t => perMs(t) * DAY,
  'rate.month': t => perMs(t) * DAY * 30.42,
  'rate.year': t => perMs(t) * YEAR,
  'cycle.pct': t => (t - mStart(t)) / (mNext(t) - mStart(t)),
};
PL.forEach(p => {
  V['active.' + p.id] = t => acc(p, t) - acc(p, mStart(t));
  V['term.' + p.id] = t => Math.min(Math.max((t - p.start) / (p.term * DAY), 0), 1);
  V['rate.day.' + p.id] = t => isLive(p, t) ? p.amount * p.apy / 365 : 0;
});

const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WD = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const pad = n => String(n).padStart(2, '0');
const dfmt = t => { const d = new Date(t); return d.getDate() + ' ' + MON[d.getMonth()]; };
const countdown = ms => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 86400)}d ${pad(Math.floor(s % 86400 / 3600))}h ${pad(Math.floor(s % 3600 / 60))}m ${pad(s % 60)}s`;
};
const TX = {
  'payout.date': t => dfmt(mNext(t)),
  'cycle.start': t => dfmt(mStart(t)),
  'cycle.left': t => countdown(mNext(t) - t),
  'cycle.day': t => `Day ${Math.floor((t - mStart(t)) / DAY) + 1} of ${Math.round((mNext(t) - mStart(t)) / DAY)}`,
  cur: () => sim.cur === 'kau' ? 'KAU' : 'USD',
};
PL.forEach(p => {
  TX['mat.' + p.id] = () => dfmt(p.start + p.term * DAY);
  TX['termday.' + p.id] = t => `Day ${Math.min(p.term, Math.floor((t - p.start) / DAY) + 1)} of ${p.term}`;
});

const fnum = (v, dp) => {
  const [i, f] = Math.abs(v).toFixed(dp).split('.');
  return (v < 0 ? '-' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (f !== undefined ? '.' + f : '');
};

/* ---------------- icons ---------------- */
const I = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M16 14.5h2"/>',
  chart: '<path d="M5 20v-6M10 20V8M15 20v-9M20 20V5"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 10h18M7 15h4"/>',
  gift: '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8S10.5 3.5 8 4.5 9.5 8 12 8zm0 0s1.5-4.5 4-3.5S14.5 8 12 8z"/>',
  userplus: '<circle cx="9" cy="8" r="4"/><path d="M2 21c.5-4 3.4-6 7-6s6.5 2 7 6M19 8v6M16 11h6"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8"/>',
  refresh: '<path d="M20 11A8 8 0 0 0 5.3 7M4 13a8 8 0 0 0 14.7 4M4 4v4h4M20 20v-4h-4"/>',
  pay: '<circle cx="12" cy="12" r="9"/><path d="M9 15l6-6M10 9h5v5"/>',
  store: '<path d="M4 9h16l-1.2-5H5.2zM5 9v11h14V9M9.5 20v-5h5v5"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  grid: '<path d="M5 5h.01M12 5h.01M19 5h.01M5 12h.01M12 12h.01M19 12h.01M5 19h.01M12 19h.01M19 19h.01" stroke-width="3.2"/>',
  chevd: '<path d="m6 9 6 6 6-6"/>',
  chevr: '<path d="m9 6 6 6-6 6"/>',
  upr: '<path d="M7 17 17 7M8 7h9v9"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  swap: '<path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4"/>',
  spark: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  exch: '<path d="M4 8h14l-3-3M20 16H6l3 3"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6z"/>',
};
const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[n] || ''}</svg>`;
window.KIC = ic;

/* ---------------- static page pieces ---------------- */
const PP = (() => {
  let s = 11; const r = () => (s = s * 16807 % 2147483647) / 2147483647;
  let v = 0; const a = [];
  for (let i = 0; i < 150; i++) { v += (r() - .5) * 1.7 + Math.sin(i / 8) * .22 + (i > 95 ? .07 : 0); a.push(v); }
  const mn = Math.min(...a), mx = Math.max(...a);
  return a.map((y, i) => `${i ? 'L' : 'M'}${(i / (a.length - 1) * 600).toFixed(1)} ${(6 + (1 - (y - mn) / (mx - mn)) * 188).toFixed(1)}`).join('');
})();
const priceChart = h => `<div class="pchart" style="height:${h}px">
  <svg viewBox="0 0 600 200" preserveAspectRatio="none" style="height:${h}px"><path d="${PP} L600 200 L0 200Z" fill="rgba(154,123,79,.07)"/><path d="${PP}" fill="none" stroke="#8b7346" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>
  <div class="ylab"><span>$138.00</span><span>$136.00</span><span>$134.00</span><span>$132.00</span><span>$130.00</span></div></div>`;

const LOGO = `<svg width="22" height="24" viewBox="0 0 22 24"><path d="M1 1h6v9.2L15.4 1H22l-9.6 10.4L22 23h-6.8L7 13v10H1z" fill="#ef3b4f"/></svg>`;

const defBalance = () => `<section class="card">
  <div class="row between"><span class="h3">KAU balance</span><div class="row"><button class="btn">Send</button><button class="btn">Receive</button></div></div>
  <div class="bal-big"><span data-v="balance" data-dp="5"></span><small>g</small></div>
  <div class="bal-sub"><span data-v="balance" data-u="usd"></span><span class="green">${ic('upr')}$246.11 (4.71%)</span><span class="fnt">All</span></div>
  <div class="stats">
    <div class="stat"><span class="lbl">Realised return</span><b class="green">↗$612.86</b></div>
    <div class="stat"><span class="lbl">Total return</span><b class="green">↗<span data-v="totalReturn" data-u="usd"></span></b></div>
    <div class="stat"><span class="lbl">Cost basis</span><b>$925.00</b></div>
    <div class="stat"><span class="lbl">Allocation</span><b>52.6%</b></div>
  </div></section>`;

const defEarnings = () => `<section class="card">
  <span class="h3">KAU earnings</span>
  <div class="be"><div class="be-g">
    <div><div class="lbl">Active earnings</div><div class="be-big" data-v="active" data-dp="6"></div><div class="lbl">≈<span data-v="active" data-u="usd"></span></div></div>
    <div><div class="lbl">Lifetime earnings</div><div class="be-big green" data-v="lifetime" data-u="usd"></div><div class="lbl">Paid to date</div></div>
  </div>
  <button class="be-pl"><span class="row"><i class="pdot"></i>2 active pledges</span><span class="row"><span class="mut">6.50 KAU</span>${ic('chevr')}</span></button></div>
</section>`;

const defActivity = () => `<section class="card">
  <div class="row between act-h"><span class="h3">Activity</span><button class="btn sm">See all</button></div>
  <div class="act-row"><span class="act-ic">${ic('up')}</span><div class="act-nm"><b>To Sean Norris</b></div><div class="act-am">-1.34929 g</div><div class="act-us">-$182.69</div><div class="act-dt">Today, 9:41</div></div>
  <div class="act-row"><span class="act-ic">${ic('exch')}</span><div class="act-nm"><b>USD → KAU</b></div><div class="act-am">+0.18390 g</div><div class="act-us">$24.90</div><div class="act-dt">Yesterday, 9:41</div></div>
  <div class="act-row"><span class="act-ic">${ic('refresh')}</span><div class="act-nm"><b>Gold – Holder's yield</b></div><div class="act-am">+0.20941 g</div><div class="act-us">$28.35</div><div class="act-dt">Sun 24 Nov, 9:41</div></div>
</section>`;

const defBuy = () => `<section class="card buy">
  <div class="row between"><div class="seg dk"><button class="on">Buy</button><button>Sell</button></div><button class="btn">${ic('card')}Buy with card</button></div>
  <div class="buy-h">Buy Gold</div>
  <div class="row between"><div class="seg"><button>25%</button><button>50%</button><button>Max</button></div><button class="btn" style="background:none">Instant buy ${ic('chevd')}</button></div>
  <div class="buy-boxes">
    <div class="buy-box"><div><div class="lbl">Pay</div><div class="buy-v">$0</div></div><div class="buy-asset"><span class="row"><span class="c1usd">1</span><b>C1USD</b>${ic('chevd')}</span><span class="lbl">Balance $0.00</span></div></div>
    <span class="swap">${ic('swap')}</span>
    <div class="buy-box"><div><div class="lbl">Receive</div><div class="buy-v">0</div></div><div class="buy-asset"><span class="row"><span class="kau"></span><b>KAU</b>${ic('chevd')}</span><span class="lbl">Balance 12.65850</span></div></div>
  </div>
  <div class="rate">1 KAU = $135.40</div>
  <button class="btn primary buy-cta">Buy Gold</button>
</section>`;

const NAV = [['home','Home'],['clock','Activity'],['wallet','Assets',1],['chart','Exchange'],['card','Virtual card'],['gift','Earn'],['userplus','Refer'],['award','Yields'],['refresh','Metalback'],['pay','Payments'],['store','Merchant']];

const desktop = p => `<div class="d-browser app">
  <div class="d-chrome"><span class="d-dots"><i></i><i></i><i></i></span>${ic('back')}${ic('chevr')}
    <div class="d-url">${ic('lock')}kms.kinesis.money</div>${ic('plus')}</div>
  <div class="d-app">
    <aside class="d-side"><div class="d-logo">${LOGO}</div>
      <nav class="d-nav">${NAV.map(([i, l, on]) => `<a class="${on ? 'on' : ''}">${ic(i)}${l}</a>`).join('')}</nav></aside>
    <div class="d-main">
      <div class="d-top"><span>Portfolio</span><span>Prices</span><span class="sp"></span>
        ${p.pill ? `<div class="slot-pill">${p.pill}</div>` : ''}
        <span class="menu">${ic('grid')}Menu</span><span class="avatar"></span></div>
      <div class="d-body">
        <div class="d-col">
          <section class="card chart-card">
            <div class="row between chart-head"><div class="row"><span class="icon-btn">${ic('back')}</span><span class="asset-pill"><span class="kau"></span>Gold${ic('chevd')}</span></div><span class="mut">${ic('star')}</span></div>
            <div class="row between" style="align-items:flex-end"><div><div class="price">$135.40</div><div class="chg">${ic('upr')}$6.13 (4.74%)</div></div>
              <div class="seg"><button>1D</button><button>1W</button><button>1M</button><button class="on">1Y</button><button>All</button></div></div>
            ${priceChart(190)}
          </section>
          <div class="slot" data-slot="balance">${p.balance ?? defBalance()}</div>
          <div class="slot" data-slot="earnings">${p.earnings ?? defEarnings()}</div>
          <div class="slot" data-slot="activity">${p.activity ?? defActivity()}</div>
        </div>
        <div class="d-col"><div class="slot">${p.buy ?? defBuy()}</div></div>
      </div>
    </div>
    ${p.sheet ? `<div class="overlay d-ov" data-overlay><div class="d-drawer slot"><button class="sheet-x" data-close aria-label="Close">${ic('x')}</button>${p.sheet}</div></div>` : ''}
  </div></div>`;

const mobile = p => {
  const sheet = p.sheet ?? p.buy;
  return `<div class="m-device"><div class="m-screen app">
  <div class="m-island"></div>
  <div class="m-scroll">
    <div class="m-status"><span>9:41</span><svg viewBox="0 0 68 12" width="68"><rect x="0" y="7" width="3" height="5" rx="1" fill="#0f1720"/><rect x="5" y="5" width="3" height="7" rx="1" fill="#0f1720"/><rect x="10" y="3" width="3" height="9" rx="1" fill="#0f1720"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#0f1720"/><path d="M27 4.5a8 8 0 0 1 11 0M29.3 7a4.5 4.5 0 0 1 6.4 0M31.6 9.4a1.3 1.3 0 0 1 1.8 0" stroke="#0f1720" stroke-width="1.6" fill="none" stroke-linecap="round"/><rect x="43" y="1" width="22" height="10" rx="3" fill="none" stroke="#0f1720" stroke-opacity=".4"/><rect x="45" y="3" width="16" height="6" rx="1.5" fill="#0f1720"/></svg></div>
    <div class="m-nav"><span class="icon-btn">${ic('back')}</span><span class="asset-pill"><span class="kau"></span>Gold${ic('chevd')}</span><span class="icon-btn">${ic('star')}</span></div>
    <div class="m-pad">
      <div><div class="m-price">$135.40</div><div class="chg">${ic('upr')}$6.13 (4.74%) <span class="fnt" style="font-weight:400;margin-left:4px">1Y</span></div></div>
      ${p.pill ? `<div class="slot-pill">${p.pill}</div>` : ''}
      ${priceChart(150)}
      <div class="seg full"><button>1D</button><button>1W</button><button>1M</button><button class="on">1Y</button><button>All</button></div>
      <div class="m-acts">
        <button class="m-act pri" ${sheet ? 'data-open' : ''}><span class="c">${ic('plus')}</span>Buy</button>
        <button class="m-act"><span class="c">${ic('down')}</span>Sell</button>
        <button class="m-act"><span class="c">${ic('up')}</span>Send</button>
        <button class="m-act"><span class="c">${ic('down')}</span>Receive</button>
      </div>
      <div class="slot" data-slot="balance">${p.balance ?? defBalance()}</div>
      <div class="slot" data-slot="earnings">${p.earnings ?? defEarnings()}</div>
      <div class="slot" data-slot="activity">${p.activity ?? defActivity()}</div>
      <section class="card"><span class="h3">About Gold</span>
        <p class="lbl" style="line-height:1.5;margin:8px 0 12px">KAU is 1 gram of allocated, fully insured physical gold held in vaults. Hold it, spend it, or pledge it to earn a yield paid in gold.</p>
        <div class="stats two"><div class="stat"><span class="lbl">Market cap</span><b>$214.6M</b></div><div class="stat"><span class="lbl">Vaulted</span><b>1,585 kg</b></div></div></section>
    </div>
  </div>
  <nav class="m-tab"><a>${ic('home')}Home</a><a class="on">${ic('wallet')}Assets</a><a>${ic('exch')}Exchange</a><a>${ic('gift')}Earn</a><a>${ic('menu')}Menu</a></nav>
  ${sheet ? `<div class="overlay m-ov" data-overlay><div class="m-sheet slot"><span class="grab"></span>${sheet}</div></div>` : ''}
  <span class="m-home"></span>
</div></div>`;
};

/* ---------------- build sections ---------------- */
const partsOf = tpl => {
  const get = n => { const el = tpl.content.querySelector(`[data-part="${n}"]`); return el ? el.innerHTML : null; };
  return { earnings: get('earnings'), balance: get('balance'), pill: get('pill'), sheet: get('sheet'), buy: get('buy'), activity: get('activity') };
};

document.querySelectorAll('.concept[data-tpl]').forEach(sec => {
  const tpl = document.getElementById(sec.dataset.tpl);
  const p = partsOf(tpl);
  sec.querySelector('.fd').insertAdjacentHTML('beforeend', `<div class="fit" data-w="1200"><div class="fit-in">${desktop(p)}</div></div>`);
  sec.querySelector('.fm').insertAdjacentHTML('beforeend', `<div class="fit" data-w="414"><div class="fit-in">${mobile(p)}</div></div>`);
  sec._focus = tpl.dataset.focus || 'earnings';
});
document.querySelectorAll('[data-ic]').forEach(el => { if (!el.innerHTML.trim()) el.innerHTML = ic(el.dataset.ic); });

/* ---------------- fit-to-width scaling ---------------- */
const fitOne = f => {
  const inn = f.firstElementChild, s = Math.min(1, f.clientWidth / +f.dataset.w);
  inn.style.transform = `scale(${s})`;
  f.style.height = Math.ceil(inn.offsetHeight * s) + 'px';
};
const ro = new ResizeObserver(es => es.forEach(e => fitOne(e.target.classList.contains('fit') ? e.target : e.target.parentElement)));
document.querySelectorAll('.fit').forEach(f => { ro.observe(f); ro.observe(f.firstElementChild); fitOne(f); });

// scroll each phone so the concept is in view
document.fonts.ready.then(() => requestAnimationFrame(() => {
  document.querySelectorAll('.concept[data-tpl]').forEach(sec => {
    const sc = sec.querySelector('.m-scroll'), target = sc && sc.querySelector(`[data-slot="${sec._focus}"]`);
    if (!target) return;
    const box = sc.getBoundingClientRect(), s = box.height / sc.offsetHeight;
    sc.scrollTop += (target.getBoundingClientRect().top - box.top) / s - 112;
  });
  const h = location.hash && document.querySelector(location.hash);
  if (h) h.scrollIntoView();
}));

/* ---------------- live rendering ---------------- */
const roots = [...document.querySelectorAll('.app')].map(el => ({
  el, vis: false,
  v: [...el.querySelectorAll('[data-v]')], t: [...el.querySelectorAll('[data-t]')], w: [...el.querySelectorAll('[data-w]')],
  ring: [...el.querySelectorAll('[data-ring]')], rot: [...el.querySelectorAll('[data-rot]')],
  odo: [...el.querySelectorAll('[data-odo]')], chart: [...el.querySelectorAll('[data-chart]')], calc: [...el.querySelectorAll('.c8')],
}));
const io = new IntersectionObserver(es => es.forEach(e => { const r = roots.find(r => r.el === e.target); if (r) r.vis = e.isIntersecting; }), { rootMargin: '300px' });
roots.forEach(r => io.observe(r.el));

const unitOf = u => u === 'pri' ? sim.cur : u === 'sec' ? (sim.cur === 'kau' ? 'usd' : 'kau') : (u || 'kau');

function renderVal(el, get) {
  const d = el.dataset, usd = unitOf(d.u) === 'usd';
  let v = get(d.v); if (usd) v *= PRICE;
  let s = fnum(v, usd ? +(d.dpu ?? 2) : +(d.dp ?? 5));
  if (d.split != null) {
    const cut = s.indexOf('.') + 1 + +(usd ? (d.splitu ?? 2) : d.split);
    s = `${s.slice(0, cut)}<span class="lo">${s.slice(cut)}</span>`;
  }
  const html = (usd ? '$' : '') + s + (!usd && d.lbl ? `<small class="ul">${d.lbl}</small>` : '');
  if (el._h !== html) { el._h = html; el.innerHTML = html; }
}

const DIG = '0123456789'.split('').map(n => `<span>${n}</span>`).join('');
function renderOdo(el, get) {
  const d = el.dataset, usd = unitOf(d.u) === 'usd';
  let v = get(d.odo); if (usd) v *= PRICE;
  const s = (usd ? '$' : '') + fnum(v, usd ? +(d.dpu ?? 6) : +(d.dp ?? 8));
  if (s === el._s) return;
  if (!el._s || el._s.length !== s.length || el._usd !== usd) {
    const cut = s.indexOf('.') + 1 + +(usd ? (d.splitu ?? 2) : (d.split ?? 99));
    el.innerHTML = [...s].map((c, i) => /\d/.test(c) ? `<span class="od${i >= cut ? ' lo' : ''}"><span class="os">${DIG}</span></span>` : `<span class="oc">${c}</span>`).join('');
    el._cols = [...el.children]; el._usd = usd;
  }
  [...s].forEach((c, i) => { if (/\d/.test(c)) el._cols[i].firstChild.style.transform = `translateY(${-c * 10}%)`; });
  el._s = s;
}

function renderChart(svg, t) {
  const W = svg.clientWidth || 560, H = 200, L = 4, R = 64, TP = 14, B = 24;
  const cs = mStart(t), np = mNext(t), proj = V.projected(t), ymax = Math.max(proj * 1.12, 1e-9);
  const X = x => L + (x - cs) / (np - cs) * (W - L - R), Y = y => TP + (1 - y / ymax) * (H - TP - B);
  const act = x => sum(p => acc(p, x) - acc(p, cs));
  const pts = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => { const x = a + (b - a) * i / n; return [X(x), Y(act(x))]; });
  const line = ps => ps.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('');
  const a = pts(cs, t, 60), pr = pts(t, np, 20), now = a[a.length - 1];
  let g = '';
  for (let k = 0; k <= 4; k++) { const y = Y(ymax * k / 4); g += `<line class="gl" x1="${L}" x2="${W - R + 8}" y1="${y}" y2="${y}"/><text class="ax" x="${W - R + 14}" y="${y + 3.5}">${fnum(ymax * k / 4, 4)}</text>`; }
  for (let k = 0; k <= 4; k++) { const x = cs + (np - cs) * k / 4; g += `<text class="ax" x="${X(x)}" y="${H - 6}" text-anchor="${k === 0 ? 'start' : k === 4 ? 'end' : 'middle'}">${dfmt(x)}</text>`; }
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = `<defs><linearGradient id="c6g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d9b4b" stop-opacity=".22"/><stop offset="1" stop-color="#1d9b4b" stop-opacity="0"/></linearGradient></defs>${g}
    <path d="${line(a)} L${now[0]} ${Y(0)} L${X(cs)} ${Y(0)}Z" fill="url(#c6g)"/>
    <path d="${line(a)}" fill="none" stroke="#1d9b4b" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="${line(pr)}" fill="none" stroke="#9a7b4f" stroke-width="1.6" stroke-dasharray="4 4"/>
    <circle cx="${pr[pr.length - 1][0]}" cy="${pr[pr.length - 1][1]}" r="4" fill="#fff" stroke="#9a7b4f" stroke-width="2"/>
    <line x1="${now[0]}" x2="${now[0]}" y1="${now[1]}" y2="${Y(0)}" stroke="#1d9b4b" stroke-opacity=".3" stroke-dasharray="2 3"/>
    <circle cx="${now[0]}" cy="${now[1]}" r="9" fill="#1d9b4b" fill-opacity=".15"><animate attributeName="r" values="5;12;5" dur="1.8s" repeatCount="indefinite"/></circle>
    <circle cx="${now[0]}" cy="${now[1]}" r="4.5" fill="#1d9b4b" stroke="#fff" stroke-width="2"/>
    <text class="now" x="${now[0] - 8}" y="${now[1] - 12}" text-anchor="end">Now</text>`;
}

function renderCalc(c) {
  const a = c._amt, apy = c._apy, d = a * apy / 365;
  const out = {
    amt: fnum(a, 5), amtusd: '≈ $' + fnum(a * PRICE, 2),
    day: '+' + fnum(d, 6), dayusd: '≈ $' + fnum(d * PRICE, 2),
    month: '+' + fnum(d * 30.42, 5), monthusd: '≈ $' + fnum(d * 30.42 * PRICE, 2),
    year: '+' + fnum(a * apy, 4), yearusd: '≈ $' + fnum(a * apy * PRICE, 2),
    live: '+' + fnum(a * apy / YEAR * (sim.t - T0), 8) + ' KAU',
  };
  c._outs ||= [...c.querySelectorAll('[data-calc-out]')];
  c._outs.forEach(e => { const s = out[e.dataset.calcOut]; if (e._h !== s) { e._h = s; e.textContent = s; } });
}
document.querySelectorAll('.c8').forEach(c => { c._amt = 6; c._apy = .06; });

/* ---------------- payouts + clock ---------------- */
const clock = document.getElementById('simclock');
const toastEl = document.getElementById('toast');
let lastCS = mStart(sim.t);
function checkPayout() {
  const cs = mStart(sim.t);
  if (cs === lastCS) return;
  if (cs > lastCS) {
    const amt = sum(p => acc(p, cs) - acc(p, lastCS));
    toastEl.querySelector('.tm').innerHTML = `<b>Payout landed · +${fnum(amt, 5)} KAU</b> ($${fnum(amt * PRICE, 2)}) paid to balance on ${dfmt(cs)}. Active earnings reset.`;
    toastEl.classList.add('show'); clearTimeout(toastEl._t); toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 4200);
    document.querySelectorAll('[data-v="lifetime"],[data-v="balance"]').forEach(e => { e.classList.remove('flash'); void e.offsetWidth; e.classList.add('flash'); });
  }
  lastCS = cs;
}

let last = performance.now(), chartAt = 0;
function frame(now) {
  sim.t += (now - last) * sim.speed; last = now;
  checkPayout();
  const t = sim.t, cache = {};
  const get = k => cache[k] ?? (cache[k] = V[k](t));
  const doChart = now - chartAt > 90; if (doChart) chartAt = now;
  for (const r of roots) {
    if (!r.vis) continue;
    r.v.forEach(el => renderVal(el, get));
    r.odo.forEach(el => renderOdo(el, get));
    r.t.forEach(el => { const s = TX[el.dataset.t](t); if (el._h !== s) { el._h = s; el.textContent = s; } });
    r.w.forEach(el => { el.style.width = (get(el.dataset.w) * 100).toFixed(3) + '%'; });
    r.ring.forEach(el => { el.style.strokeDashoffset = (552.92 * (1 - get(el.dataset.ring))).toFixed(2); });
    r.rot.forEach(el => el.setAttribute('transform', `rotate(${(get(el.dataset.rot) * 360).toFixed(3)} 115 115)`));
    r.chart.forEach(el => { if (doChart || !el._drawn) { renderChart(el, t); el._drawn = true; } });
    r.calc.forEach(renderCalc);
  }
  const d = new Date(t);
  clock.className = 'simclock' + (sim.speed > 1 ? ' fast' : '');
  clock.innerHTML = `<i></i>${sim.speed > 1 ? 'Simulated' : 'Live'} · ${WD[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------------- interactions ---------------- */
document.addEventListener('click', e => {
  const tg = e.target, app = tg.closest('.app');
  const sp = tg.closest('[data-speed]');
  if (sp) { sim.speed = +sp.dataset.speed; sp.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === sp)); return; }
  const cu = tg.closest('[data-cur]');
  if (cu) { sim.cur = cu.dataset.cur; cu.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === cu)); return; }
  const zm = tg.closest('[data-zoom]');
  if (zm) { const s = zm.closest('.concept'); s.classList.toggle('zoomed'); zm.textContent = s.classList.contains('zoomed') ? 'Side by side' : 'Full size'; return; }
  if (!app) return;
  const ov = app.querySelector('[data-overlay]');
  if (ov && tg.closest('[data-open]')) { ov.hidden = false; return; }
  if (ov && (tg === ov || tg.closest('[data-close]'))) { ov.hidden = true; return; }
  const tb = tg.closest('[data-tab]');
  if (tb) {
    const box = tb.closest('[data-tabs]');
    box.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b === tb));
    box.querySelectorAll('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== tb.dataset.tab; });
    return;
  }
  if (tg.closest('[data-eye]')) { app.classList.toggle('masked'); return; }
  const c8 = tg.closest('.c8');
  const pct = tg.closest('[data-pct]');
  if (c8 && pct) { c8._amt = +(BAL0 * +pct.dataset.pct).toFixed(5); c8.querySelector('[data-calc="amt"]').value = c8._amt; }
  const ap = tg.closest('[data-apy]');
  if (c8 && ap) c8._apy = +ap.dataset.apy;
  const sb = tg.closest('.seg button');
  if (sb) sb.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === sb));
});
document.addEventListener('input', e => {
  if (e.target.matches('[data-calc="amt"]')) e.target.closest('.c8')._amt = +e.target.value;
});
})();
