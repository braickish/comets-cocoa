// Comet's Cocoa: the loop, the counter, the two stations and the screens.
import {
  MUG_SIZES, FLAVORS, COCOA_TOPPINGS, NOODLES, SAUCES, PASTA_TOPPINGS,
  ELVES, REINDEER, SEATS, LAST_DAY, POUR_RATE, COOK_PERFECT, dayRules,
} from './data.js';
import {
  makeRng, unlocked, makeOrder, newMug, newBowl, pour, addTopping, cookState,
  grade, reaction, SCHEDULE_START, serveBoost, LEAVE_PENALTY, coinsFor, drainPerSecond, starsFor,
} from './logic.js';
import { elf, reindeer, mug, bowl, pot, ICONS, TOYS } from './art.js';
import { Sound } from './sound.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);

// ---------- Saved progress ----------
const SAVE_KEY = 'comets-cocoa';
let save = { day: 1, coins: 0 };
try { Object.assign(save, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); } catch {}
const store = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch {} };

// ---------- State ----------
const S = {
  phase: 'title', day: 1, time: 0, meter: SCHEDULE_START, coins: 0, served: 0, perfect: 0, left: 0,
  seats: Array(SEATS).fill(null), spawnT: 0, rng: makeRng(Number(params.get('seed')) || Date.now()),
  mug: null, pouring: null, pourSoundT: 0, bowl: null, pot: null, potWasReady: false,
  tab: 'cocoa', target: -1,
};
let R = dayRules(1);
let nextId = 1;

// ---------- Small helpers ----------
const toastTimers = {};
function toast(where, msg) {
  const el = $(`${where}-toast`);
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimers[where]);
  toastTimers[where] = setTimeout(() => el.classList.remove('show'), 1500);
  Sound.wrong();
}
const nameOf = (list, id) => list.find((x) => x.id === id)?.name ?? id;

// ---------- Buttons ----------
function ingButton(icon, name, onTap, extra = '') {
  const b = document.createElement('button');
  b.className = `ing ${extra}`;
  b.innerHTML = `${icon}<b></b>`;
  b.title = name; b.setAttribute('aria-label', name);
  if (onTap) b.addEventListener('click', () => { Sound.unlock(); onTap(); });
  return b;
}
function buildButtons() {
  const day = S.day;
  // Mugs.
  const mb = $('mug-btns'); mb.innerHTML = '';
  for (const m of MUG_SIZES) mb.append(ingButton(ICONS[m.id], m.name, () => pickMug(m.id)));
  // Flavors: hold to pour.
  const fb = $('flavor-btns'); fb.innerHTML = '';
  for (const f of unlocked(FLAVORS, day)) {
    const b = ingButton(ICONS.flavor(f.id), `${f.name} cocoa (hold to pour)`, null, 'pour');
    const stop = () => { if (S.pouring?.btn === b) { S.pouring = null; b.classList.remove('held'); } };
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault(); Sound.unlock();
      if (!S.mug) return toast('cocoa', 'Pick a mug first!');
      if (S.mug.spilled) return toast('cocoa', 'It spilled! Toss it and start again.');
      try { b.setPointerCapture(e.pointerId); } catch {}
      S.pouring = { flavor: f.id, btn: b }; b.classList.add('held');
    });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(ev, stop);
    b.addEventListener('contextmenu', (e) => e.preventDefault());
    fb.append(b);
  }
  // Cocoa toppings.
  const cb = $('cocoa-top-btns'); cb.innerHTML = '';
  for (const t of unlocked(COCOA_TOPPINGS, day)) {
    const b = ingButton(ICONS[t.id], t.name, () => topping('cocoa', t.id));
    b.dataset.top = t.id; cb.append(b);
  }
  // Noodles.
  const nb = $('noodle-btns'); nb.innerHTML = '';
  for (const n of unlocked(NOODLES, day)) nb.append(ingButton(ICONS[n.id], n.name, () => startNoodles(n.id)));
  const sb = $('sauce-btns'); sb.innerHTML = '';
  for (const s of unlocked(SAUCES, day)) sb.append(ingButton(ICONS.sauce(s.id), `${s.name} sauce`, () => addSauce(s.id)));
  const pb = $('pasta-top-btns'); pb.innerHTML = '';
  for (const t of unlocked(PASTA_TOPPINGS, day)) {
    const b = ingButton(ICONS[t.id], t.name, () => topping('pasta', t.id));
    b.dataset.top = t.id; pb.append(b);
  }
  // The pasta station only opens once reindeer start coming (Dec 2).
  const pasta = R.pastaShare > 0;
  $('pasta').hidden = !pasta;
  $('cocoa').classList.toggle('solo', !pasta);
  document.querySelector('.tabs').classList.toggle('single', !pasta);
  if (!pasta) setTab('cocoa');
}
$('cocoa-trash').innerHTML = ICONS.trash; $('cocoa-trash').title = 'Toss the mug';
$('pasta-trash').innerHTML = ICONS.trash; $('pasta-trash').title = 'Toss the bowl';
$('cocoa-trash').addEventListener('click', () => { if (S.mug) { S.mug = null; S.pouring = null; Sound.trash(); drawMug(); } });
$('pasta-trash').addEventListener('click', () => { if (S.bowl) { S.bowl = null; Sound.trash(); drawBowl(); } });
$('drain').addEventListener('click', drainNoodles);
document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => { Sound.tap(); setTab(b.dataset.tab); }));
function setTab(tab) {
  S.tab = tab;
  document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
  document.querySelectorAll('.station').forEach((s) => s.classList.toggle('on', s.id === tab));
}

// ---------- Cocoa ----------
function pickMug(size) {
  if (S.mug && S.mug.fill > 0.02) return toast('cocoa', 'Serve or toss this one first');
  S.mug = newMug(size); Sound.clink(); drawMug();
}
function topping(where, id) {
  const item = where === 'cocoa' ? S.mug : S.bowl;
  if (!item) return toast(where, where === 'cocoa' ? 'Pick a mug first!' : 'Cook some noodles first!');
  const msg = addTopping(item, id);
  if (msg) return toast(where, msg);
  ({ cream: Sound.squirt, sprinkles: Sound.shake, crumbles: Sound.shake, chips: Sound.shake, drizzle: Sound.squirt }[id] || Sound.plop)();
  where === 'cocoa' ? drawMug() : drawBowl();
}
function drawMug() {
  $('mug-view').innerHTML = mug(S.mug);
  markToppings('cocoa-top-btns', S.mug);
  updateTargets();
}
function markToppings(boxId, item) {
  for (const b of $(boxId).children) {
    const v = item ? item.toppings[b.dataset.top] : 0;
    b.classList.toggle('on', !!v);
    const badge = b.querySelector('b');
    badge.textContent = typeof v === 'number' && v > 0 ? v : '';
    badge.classList.toggle('on', typeof v === 'number' && v > 0);
  }
}

// ---------- Pasta ----------
function startNoodles(id) {
  if (S.pot) return toast('pasta', "The pot's busy. Drain it first!");
  S.pot = { noodle: id, t: 0 }; S.potWasReady = false; Sound.splash(); drawPot();
}
function drainNoodles() {
  if (!S.pot) return;
  if (S.bowl && S.bowl.noodle) return toast('pasta', 'Serve or toss the bowl first');
  S.bowl = newBowl();
  S.bowl.noodle = S.pot.noodle; S.bowl.cook = cookState(S.pot.t);
  S.pot = null; Sound.drain(); drawPot(); drawBowl();
}
function addSauce(id) {
  if (!S.bowl) return toast('pasta', 'Cook some noodles first!');
  if (S.bowl.sauce) return toast('pasta', 'It already has sauce');
  S.bowl.sauce = id; Sound.splash(); drawBowl();
}
function drawBowl() { $('bowl-view').innerHTML = bowl(S.bowl); markToppings('pasta-top-btns', S.bowl); updateTargets(); }
let potKey = '';
function drawPot() {
  const key = S.pot ? `${S.pot.noodle}:${cookState(S.pot.t)}` : '';
  if (key !== potKey) { potKey = key; $('pot-view').innerHTML = pot(S.pot?.noodle, S.pot && cookState(S.pot.t)); }
  const needle = $('cook-needle'), drain = $('drain'), badge = $('pot-badge');
  const SPAN = COOK_PERFECT[1] + 4;
  if (!S.pot) { needle.style.display = 'none'; drain.disabled = true; drain.classList.remove('ready'); badge.textContent = ''; badge.className = ''; return; }
  needle.style.display = 'block';
  needle.style.left = `${Math.min(100, (S.pot.t / SPAN) * 100)}%`;
  drain.disabled = false;
  const st = cookState(S.pot.t);
  drain.classList.toggle('ready', st === 'perfect');
  badge.className = st === 'perfect' ? 'ready' : st === 'mushy' ? 'mushy' : 'cooking';
  badge.textContent = st === 'perfect' ? 'ready!' : st === 'mushy' ? 'mushy' : `${Math.ceil(COOK_PERFECT[0] - S.pot.t)}s`;
}
function layoutCookbar() {
  const SPAN = COOK_PERFECT[1] + 4;
  const z = document.querySelectorAll('.cookbar .zone');
  z[0].style.width = `${(COOK_PERFECT[0] / SPAN) * 100}%`;
  z[1].style.width = `${((COOK_PERFECT[1] - COOK_PERFECT[0]) / SPAN) * 100}%`;
  z[2].style.width = `${(4 / SPAN) * 100}%`;
}

// ---------- Customers ----------
function spawn() {
  const free = S.seats.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
  if (!free.length) return;
  const seat = S.rng.pick(free);
  const kind = S.rng() < R.pastaShare ? 'pasta' : 'cocoa';
  // Don't seat the same character twice at once.
  const pool = (kind === 'cocoa' ? ELVES : REINDEER).filter((p) => !S.seats.some((c) => c && c.look === p));
  const look = S.rng.pick(pool.length ? pool : kind === 'cocoa' ? ELVES : REINDEER);
  const c = { id: nextId++, kind, look, order: makeOrder(kind, S.day, S.rng), patience: R.patience, wait: 0, mood: 'happy', done: false };
  S.seats[seat] = c;
  const el = document.createElement('div');
  el.className = 'seat-inner';
  el.innerHTML = `<div class="ticket"></div><div class="customer"></div><div class="patience"><div></div></div>`;
  c.el = el;
  $('seats').children[seat].append(el);
  drawTicket(c); drawCustomer(c);
  Sound.arrive();
  updateTargets();
}
function drawCustomer(c) {
  c.el.querySelector('.customer').innerHTML = c.kind === 'cocoa' ? elf(c.look, c.mood) : reindeer(c.look, c.mood);
}
function it(icon, n) { return `<div class="it">${icon}${n > 1 ? `<b>${n}</b>` : ''}</div>`; }
function drawTicket(c, say, cls = '') {
  const t = c.el.querySelector('.ticket');
  t.className = `ticket ${cls}`;
  if (say) { t.innerHTML = `<div class="name">${c.look.name}</div><div class="say">${say}</div>`; return; }
  const o = c.order;
  let html = `<div class="name">${c.look.name}</div>`;
  if (o.kind === 'cocoa') {
    html += it(ICONS[o.size]) + it(ICONS.flavor(o.flavor));
    for (const t2 of COCOA_TOPPINGS) if (o.toppings[t2.id]) html += it(ICONS[t2.id], o.toppings[t2.id] === true ? 1 : o.toppings[t2.id]);
  } else {
    html += it(ICONS[o.noodle]) + it(ICONS.sauce(o.sauce));
    for (const t2 of PASTA_TOPPINGS) if (o.toppings[t2.id]) html += it(ICONS[t2.id], o.toppings[t2.id] === true ? 1 : o.toppings[t2.id]);
  }
  t.innerHTML = html;
  t.title = describe(o);
}
function describe(o) {
  const tops = (list) => list.filter((t) => o.toppings[t.id]).map((t) => (o.toppings[t.id] === true ? t.name : `${o.toppings[t.id]} ${t.name}`)).join(', ');
  return o.kind === 'cocoa'
    ? `${o.size} mug of ${nameOf(FLAVORS, o.flavor)} cocoa with ${tops(COCOA_TOPPINGS)}`
    : `${nameOf(NOODLES, o.noodle)} with ${nameOf(SAUCES, o.sauce)} sauce and ${tops(PASTA_TOPPINGS)}`;
}
// Glow on the customers whose kind of order you're holding, so it's clear who to tap.
function updateTargets() {
  S.seats.forEach((c) => {
    if (!c || c.done) return;
    const holding = c.kind === 'cocoa' ? S.mug && S.mug.fill > 0.05 : S.bowl && S.bowl.noodle;
    c.el.querySelector('.customer').classList.toggle('target', !!holding);
  });
}
function serve(seat) {
  const c = S.seats[seat];
  if (!c || c.done || S.phase !== 'play') return;
  Sound.unlock();
  const item = c.kind === 'cocoa' ? S.mug : S.bowl;
  const ready = c.kind === 'cocoa' ? item && item.fill > 0.05 : item && item.noodle;
  if (!ready) {
    toast(c.kind === 'cocoa' ? 'cocoa' : 'pasta', c.kind === 'cocoa' ? `${c.look.name} wants cocoa: make it at the Cocoa Bar` : `${c.look.name} wants pasta: cook it in the pot`);
    if (R.pastaShare > 0) setTab(c.kind);
    return;
  }
  const { score, notes } = grade(c.order, item);
  const left = Math.max(0, 1 - c.wait / c.patience);
  const r = reaction(score);
  const coins = coinsFor(score, left);
  S.meter = Math.min(100, S.meter + serveBoost(score, left));
  S.coins += coins; S.served++; if (r === 'perfect') S.perfect++;
  if (c.kind === 'cocoa') { S.mug = null; S.pouring = null; drawMug(); } else { S.bowl = null; drawBowl(); }
  c.done = true;
  c.mood = r === 'bad' ? 'yuck' : 'yay';
  drawCustomer(c);
  const say = r === 'perfect' ? ['Perfect!', 'Just right!', 'Yum, thank you!', 'Back to the toys!'][S.rng.int(0, 3)] : r === 'good' ? `Thanks! (${notes[0]})` : notes.slice(0, 2).join('. ');
  drawTicket(c, say, r === 'bad' ? 'bad' : r === 'perfect' ? 'perfect' : '');
  const pop = document.createElement('div'); pop.className = 'coinpop'; pop.textContent = `+${coins}`; c.el.append(pop);
  Sound[r]();
  leave(seat, r === 'perfect' ? 1.3 : 2.2);
}
function leave(seat, after) {
  const c = S.seats[seat];
  c.done = true;
  setTimeout(() => c.el.querySelector('.customer').classList.add('leave'), after * 1000 - 500);
  setTimeout(() => { c.el.remove(); if (S.seats[seat] === c) S.seats[seat] = null; if (S.phase === 'play' && !S.seats.some(Boolean)) S.spawnT = Math.min(S.spawnT, 1.2); }, after * 1000);
}
function giveUp(seat) {
  const c = S.seats[seat];
  c.mood = 'grumpy'; drawCustomer(c);
  drawTicket(c, ['Too slow! Back to work...', 'Never mind, the toys need me!', "I'll go hungry, I guess."][S.rng.int(0, 2)], 'bad');
  S.meter -= LEAVE_PENALTY; S.left++;
  Sound.leave();
  leave(seat, 1.8);
}

// ---------- Toy belt ----------
const belt = $('belt-toys');
let beltX = 0;
const beltToys = [];
function setupBelt() {
  belt.innerHTML = ''; beltToys.length = 0;
  for (let i = 0; i < 40; i++) {
    const d = document.createElement('div'); d.className = 'toy'; d.innerHTML = TOYS[i % TOYS.length];
    belt.append(d); beltToys.push(d);
  }
}
function drawBelt(dt) {
  const speed = S.phase === 'play' ? 6 + Math.max(0, S.meter) * 0.9 : 15; // px/s: fast when on schedule
  beltX += speed * dt;
  const w = Math.max(belt.parentElement.clientWidth, 400), gap = 70;
  beltToys.forEach((d, i) => {
    const x = ((i * gap + beltX) % (beltToys.length * gap)) - gap;
    d.style.display = x > w + gap ? 'none' : 'block';
    d.style.transform = `translateX(${x}px)`;
  });
}

// ---------- HUD ----------
function drawHud() {
  $('day').textContent = S.day;
  $('coins').textContent = S.coins;
  const m = Math.max(0, Math.min(100, S.meter));
  const f = $('sched-fill');
  f.style.width = `${m}%`;
  f.className = m < 25 ? 'low' : m < 45 ? 'mid' : '';
  const st = $('sched-state');
  st.textContent = m < 25 ? 'Falling behind!' : m < 45 ? 'Slipping...' : m > 85 ? 'Ahead of schedule!' : 'On track';
  st.classList.toggle('behind', m < 25);
  $('clock-fill').style.width = `${Math.max(0, 1 - S.time / R.shift) * 100}%`;
}

// ---------- Days ----------
function newItemsOn(day) {
  return [
    ...FLAVORS.filter((x) => x.from === day).map((x) => [ICONS.flavor(x.id), `${x.name} cocoa`]),
    ...COCOA_TOPPINGS.filter((x) => x.from === day).map((x) => [ICONS[x.id], x.name]),
    ...NOODLES.filter((x) => x.from === day).map((x) => [ICONS[x.id], x.name]),
    ...SAUCES.filter((x) => x.from === day).map((x) => [ICONS.sauce(x.id), `${x.name} sauce`]),
    ...PASTA_TOPPINGS.filter((x) => x.from === day).map((x) => [ICONS[x.id], x.name]),
  ];
}
const INTROS = {
  1: "The elves are thirsty! Pick the mug they want, hold the cocoa tap to fill it to the dashed line, add their toppings, then tap the elf to hand it over.",
  2: "The reindeer are in from flying practice and they want candy pasta! Start the noodles, drain them when the bar's in the green, add sauce and toppings, then tap the reindeer.",
  24: "Christmas Eve! The sleigh leaves tonight. Keep everyone fed and the toys rolling!",
};
function showIntro(day) {
  S.phase = 'intro'; S.day = day; R = dayRules(day);
  $('intro-title').textContent = `December ${day}`;
  $('intro-text').textContent = INTROS[day] || ["More orders than yesterday. Keep up the pace!", "The toy line's busy today: fast, correct orders keep it rolling.", "Patience is short today. Watch the bars under each customer!"][day % 3];
  const items = newItemsOn(day);
  $('intro-new').innerHTML = items.length ? items.map(([icon, name]) => `<div class="ni"><div>${icon}</div>${name}</div>`).join('') : '';
  if (items.length) $('intro-new').insertAdjacentHTML('afterbegin', '<div style="width:100%;font-weight:700">New today:</div>');
  $('title').hidden = true; $('end').hidden = true; $('intro').hidden = false;
}
function startDay() {
  S.phase = 'play'; S.time = 0; S.meter = SCHEDULE_START; S.coins = 0; S.served = 0; S.perfect = 0; S.left = 0;
  S.spawnT = R.firstAfter; S.mug = null; S.bowl = null; S.pot = null; S.pouring = null;
  for (const c of S.seats) c?.el.remove();
  S.seats.fill(null);
  buildButtons(); drawMug(); drawBowl(); potKey = '-'; drawPot();
  $('intro').hidden = true;
  Sound.dayStart();
}
function endDay(lost) {
  S.phase = 'end'; S.pouring = null;
  const stars = lost ? 0 : starsFor(S.meter);
  save.coins += S.coins;
  if (!lost && S.day >= save.day) save.day = Math.min(LAST_DAY, S.day + 1);
  store();
  const won = !lost && S.day === LAST_DAY;
  $('end-title').textContent = lost ? 'The workshop fell behind!' : won ? 'Christmas is saved!' : `December ${S.day} done!`;
  $('end-stars').innerHTML = [0, 1, 2].map((i) => `<span class="${i < stars ? '' : 'dim'}">★</span>`).join('');
  $('end-text').textContent = lost
    ? `The toy line ground to a halt. You served ${S.served} order${S.served === 1 ? '' : 's'}${S.left ? ` and ${S.left} left hungry` : ''}. Try again!`
    : won ? `Every toy made, and the sleigh's packed. ${S.served} orders, ${S.perfect} perfect, ${S.coins} coins tonight. Merry Christmas, Comet!`
      : `${S.served} orders served, ${S.perfect} perfect${S.left ? `, ${S.left} left hungry` : ''}. +${S.coins} coins.`;
  $('end-next').hidden = lost || won;
  $('end-next').textContent = `On to December ${S.day + 1}`;
  $('end-retry').textContent = lost ? 'Try again' : won ? 'Play Christmas Eve again' : 'Replay this day';
  $('end').hidden = false;
  lost ? Sound.dayLost() : Sound.dayWon();
}
$('end-next').addEventListener('click', () => { Sound.unlock(); showIntro(S.day + 1); });
$('end-retry').addEventListener('click', () => { Sound.unlock(); showIntro(S.day); });
$('intro-go').addEventListener('click', () => { Sound.unlock(); startDay(); });
$('play').addEventListener('click', () => { Sound.unlock(); showIntro(1); });
$('continue').addEventListener('click', () => { Sound.unlock(); showIntro(save.day); });
$('mute').addEventListener('click', () => { Sound.unlock(); $('mute').classList.toggle('off', Sound.toggleMute()); });
$('mute').classList.toggle('off', Sound.muted);

// ---------- Loop ----------
function step(dt) {
  if (S.phase !== 'play') return;
  S.time += dt;
  // Pouring.
  if (S.pouring && S.mug) {
    const spilled = pour(S.mug, S.pouring.flavor, POUR_RATE * dt);
    S.pourSoundT -= dt;
    if (S.pourSoundT <= 0) { Sound.pour(); S.pourSoundT = 0.16; }
    if (spilled) { S.pouring.btn.classList.remove('held'); S.pouring = null; Sound.spill(); toast('cocoa', 'Whoops, it overflowed!'); }
    drawMug();
  }
  // The pot.
  if (S.pot) {
    S.pot.t += dt;
    const ready = cookState(S.pot.t) === 'perfect';
    if (ready && !S.potWasReady) Sound.ready();
    S.potWasReady = ready;
  }
  drawPot();
  // Customers.
  let waiting = 0;
  S.seats.forEach((c, i) => {
    if (!c || c.done) return;
    waiting++;
    c.wait += dt;
    const left = 1 - c.wait / c.patience;
    const bar = c.el.querySelector('.patience div');
    bar.style.width = `${Math.max(0, left) * 100}%`;
    bar.className = left < 0.25 ? 'low' : left < 0.5 ? 'mid' : '';
    const mood = left < 0.25 ? 'grumpy' : left < 0.55 ? 'waiting' : 'happy';
    if (mood !== c.mood) { c.mood = mood; drawCustomer(c); }
    if (left <= 0) giveUp(i);
  });
  // New customers while the shift's on.
  S.spawnT -= dt;
  if (S.spawnT <= 0 && S.time < R.shift - 8) {
    if (S.seats.some((c) => !c)) spawn();
    S.spawnT = R.spawnEvery * (0.8 + S.rng() * 0.4);
  }
  // The toy schedule.
  S.meter -= drainPerSecond(S.day, waiting) * dt;
  if (S.meter <= 0) { S.meter = 0; drawHud(); return endDay(true); }
  if (S.time >= R.shift) { drawHud(); return endDay(false); }
  drawHud();
}
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  step(dt);
  drawBelt(dt);
  requestAnimationFrame(frame);
}

// ---------- Start ----------
for (let i = 0; i < SEATS; i++) {
  const seat = document.createElement('div');
  seat.className = 'seat';
  seat.addEventListener('click', () => serve(i));
  $('seats').append(seat);
}
$('title-art').innerHTML = reindeer({ fur: '#a8784a', nose: '#2b1d14' }, 'yay');
if (save.day > 1) { $('continue').hidden = false; $('continue').textContent = `Continue: December ${save.day}`; }
layoutCookbar(); setupBelt(); buildButtons(); drawMug(); drawBowl(); drawPot(); drawHud();
// Test shortcuts: ?day=5 jumps straight into that day.
if (params.has('day')) { showIntro(Number(params.get('day')) || 1); if (params.has('go')) startDay(); }
window.__S = S; window.__serve = serve;
requestAnimationFrame(frame);
