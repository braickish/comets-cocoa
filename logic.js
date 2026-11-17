// Pure rules: orders, building, grading and the toy schedule. No DOM, so the
// Node tests can import it.
import {
  MUG_SIZES, FLAVORS, COCOA_TOPPINGS, NOODLES, SAUCES, PASTA_TOPPINGS,
  FILL_OK, FILL_SPILL, COOK_PERFECT, dayRules,
} from './data.js';

// Small seeded random generator (mulberry32).
export function makeRng(seed = Date.now()) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)); // inclusive
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];
  next.shuffle = (arr) => {
    const a2 = arr.slice();
    for (let i = a2.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [a2[i], a2[j]] = [a2[j], a2[i]]; }
    return a2;
  };
  return next;
}

export const unlocked = (list, day) => list.filter((x) => (x.from ?? 1) <= day);

function pickToppings(list, day, [lo, hi], maxCount, rng) {
  const avail = unlocked(list, day);
  const n = Math.min(avail.length, rng.int(lo, hi));
  const out = {};
  for (const t of list) out[t.id] = t.type === 'count' ? 0 : false;
  for (const t of rng.shuffle(avail).slice(0, n)) {
    out[t.id] = t.type === 'count' ? rng.int(1, Math.min(t.max, maxCount)) : true;
  }
  return out;
}

// An order: what the customer wants. kind 'cocoa' (elves) or 'pasta' (reindeer).
export function makeOrder(kind, day, rng) {
  const R = dayRules(day);
  if (kind === 'cocoa') {
    return {
      kind,
      size: rng.pick(MUG_SIZES).id,
      flavor: rng.pick(unlocked(FLAVORS, day)).id,
      toppings: pickToppings(COCOA_TOPPINGS, day, R.cocoaToppings, R.maxCount, rng),
    };
  }
  return {
    kind,
    noodle: rng.pick(unlocked(NOODLES, day)).id,
    sauce: rng.pick(unlocked(SAUCES, day)).id,
    toppings: pickToppings(PASTA_TOPPINGS, day, R.pastaToppings, R.maxCount, rng),
  };
}

// ---------- What you're building ----------
export function newMug(size) {
  return { kind: 'cocoa', size, flavor: null, fill: 0, spilled: false, toppings: blankToppings(COCOA_TOPPINGS) };
}
export function newBowl() {
  return { kind: 'pasta', noodle: null, cook: null, sauce: null, toppings: blankToppings(PASTA_TOPPINGS) };
}
function blankToppings(list) {
  const o = {};
  for (const t of list) o[t.id] = t.type === 'count' ? 0 : false;
  return o;
}

// Pouring: flavor is whichever tap you pour from. A second flavor makes it
// 'mixed' (never what anyone ordered). Returns true if it just spilled.
export function pour(mug, flavor, amount) {
  if (!mug || mug.spilled) return false;
  if (mug.fill > 0.02 && mug.flavor && mug.flavor !== flavor) mug.flavor = 'mixed';
  else if (!mug.flavor || mug.fill <= 0.02) mug.flavor = flavor;
  mug.fill += amount;
  if (mug.fill >= FILL_SPILL) { mug.fill = FILL_SPILL; mug.spilled = true; return true; }
  return false;
}

// Adding a topping. Returns a short message if it can't go on yet, else ''.
export function addTopping(item, id) {
  const list = item.kind === 'cocoa' ? COCOA_TOPPINGS : PASTA_TOPPINGS;
  const t = list.find((x) => x.id === id);
  if (!t) return 'Unknown topping';
  if (item.kind === 'cocoa' && item.fill < 0.3) return 'Pour the cocoa first!';
  if (item.kind === 'cocoa' && item.spilled) return 'It spilled! Toss it and start again.';
  if (item.kind === 'pasta' && !item.noodle) return 'Noodles first!';
  if (t.type === 'count') {
    if (item.toppings[id] >= t.max) return `That's the most ${t.name.toLowerCase()} that fit!`;
    item.toppings[id]++;
  } else {
    if (item.toppings[id]) return `Already has ${t.name.toLowerCase()}`;
    item.toppings[id] = true;
  }
  return '';
}

// Noodles in the pot: cooked how, after t seconds?
export function cookState(t) {
  if (t < COOK_PERFECT[0]) return 'crunchy';
  if (t <= COOK_PERFECT[1]) return 'perfect';
  return 'mushy';
}

// ---------- Grading ----------
// Compares what you made to the order: score 0..1 and what was off (short,
// friendly notes shown in the customer's speech bubble).
export function grade(order, item) {
  if (!item || item.kind !== order.kind) return { score: 0, notes: ["That's not what I ordered!"] };
  let s = 1;
  const notes = [];
  const miss = (pts, note) => { s -= pts; notes.push(note); };
  if (order.kind === 'cocoa') {
    if (item.spilled) miss(0.4, 'It spilled everywhere!');
    if (item.size !== order.size) miss(0.2, `I wanted a ${order.size} mug`);
    if (item.flavor !== order.flavor) miss(0.25, item.flavor === 'mixed' ? 'Two kinds of cocoa?' : `I asked for ${nameOf(FLAVORS, order.flavor)}`);
    if (item.fill < FILL_OK) miss(item.fill < 0.4 ? 0.35 : 0.15, 'Only half full!');
    toppingNotes(COCOA_TOPPINGS, order, item, miss);
  } else {
    if (!item.noodle) miss(0.6, 'No noodles?!');
    else {
      if (item.noodle !== order.noodle) miss(0.2, `I wanted ${nameOf(NOODLES, order.noodle).toLowerCase()}`);
      if (item.cook === 'crunchy') miss(0.25, 'Crunchy noodles!');
      if (item.cook === 'mushy') miss(0.25, 'Mushy noodles!');
    }
    if (!item.sauce) miss(0.2, 'Forgot the sauce');
    else if (item.sauce !== order.sauce) miss(0.2, `I asked for ${nameOf(SAUCES, order.sauce)}`);
    toppingNotes(PASTA_TOPPINGS, order, item, miss);
  }
  return { score: Math.max(0, Math.min(1, s)), notes };
}
function nameOf(list, id) { return list.find((x) => x.id === id)?.name ?? id; }
function toppingNotes(list, order, item, miss) {
  for (const t of list) {
    const want = order.toppings[t.id], got = item.toppings[t.id];
    const nm = t.name.toLowerCase();
    if (t.type === 'count') {
      if (want === got) continue;
      if (!got) miss(0.15, `Where are my ${nm}?`);
      else if (!want) miss(0.12, `I didn't want ${nm}`);
      else miss(Math.min(0.2, 0.07 * Math.abs(want - got)), `I wanted ${want} ${nm}, not ${got}`);
    } else if (want && !got) miss(0.15, `Forgot the ${nm}`);
    else if (!want && got) miss(0.12, `I didn't want ${nm}`);
  }
}

// How a customer feels about it.
export function reaction(score) {
  if (score >= 0.95) return 'perfect';
  if (score >= 0.65) return 'good';
  return 'bad';
}

// ---------- The toy schedule ----------
// A meter out of 100. Time (and every waiting customer) drains it; a served
// order fills it, more for a better order and for a faster one. Empty = the
// workshop has fallen behind and the day is lost.
export const SCHEDULE_START = 70;
export function serveBoost(score, patienceLeft) {
  // patienceLeft is 0..1 of their patience still unused.
  return score * 14 + (score >= 0.65 ? 6 * patienceLeft : 0) - (score < 0.65 ? 4 : 0);
}
export const LEAVE_PENALTY = 12;
export function coinsFor(score, patienceLeft) {
  if (score < 0.65) return 1;
  return Math.round(4 + score * 6 + patienceLeft * 5);
}
export function drainPerSecond(day, waiting) {
  const R = dayRules(day);
  return R.drain + R.waitDrain * waiting;
}
export function starsFor(meter) {
  if (meter <= 0) return 0;
  return meter >= 75 ? 3 : meter >= 45 ? 2 : 1;
}
