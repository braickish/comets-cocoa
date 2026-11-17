import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng, makeOrder, newMug, newBowl, pour, addTopping, cookState, grade, reaction, unlocked, starsFor, drainPerSecond, serveBoost } from '../logic.js';
import { COCOA_TOPPINGS, PASTA_TOPPINGS, FLAVORS, FILL_SPILL, LAST_DAY, dayRules } from '../data.js';

// Build exactly what an order asks for.
function make(order) {
  if (order.kind === 'cocoa') {
    const m = newMug(order.size);
    pour(m, order.flavor, 0.9);
    for (const t of COCOA_TOPPINGS) for (let i = 0; i < Number(order.toppings[t.id]); i++) assert.equal(addTopping(m, t.id), '');
    return m;
  }
  const b = newBowl();
  b.noodle = order.noodle; b.cook = 'perfect'; b.sauce = order.sauce;
  for (const t of PASTA_TOPPINGS) for (let i = 0; i < Number(order.toppings[t.id]); i++) assert.equal(addTopping(b, t.id), '');
  return b;
}

test('a correctly made order is perfect, every day', () => {
  const rng = makeRng(7);
  for (let day = 1; day <= LAST_DAY; day++) for (const kind of day < 2 ? ['cocoa'] : ['cocoa', 'pasta']) for (let i = 0; i < 30; i++) {
    const o = makeOrder(kind, day, rng);
    const g = grade(o, make(o));
    assert.equal(g.score, 1, JSON.stringify({ o, g }));
    assert.equal(reaction(g.score), 'perfect');
  }
});

test('orders only use what is unlocked that day, and always have a topping', () => {
  const rng = makeRng(3);
  for (let i = 0; i < 200; i++) {
    const o = makeOrder('cocoa', 1, rng);
    assert.equal(o.flavor, 'classic');
    for (const t of COCOA_TOPPINGS) if (t.from > 1) assert.ok(!o.toppings[t.id], t.id);
    assert.ok(Object.values(o.toppings).some(Boolean));
  }
});

test('mistakes cost points and say what was wrong', () => {
  const rng = makeRng(11);
  const o = makeOrder('cocoa', 6, rng);
  const m = make(o);
  m.size = o.size === 'small' ? 'big' : 'small';
  const g = grade(o, m);
  assert.ok(g.score < 1 && g.score > 0.6);
  assert.match(g.notes[0], /mug/);
  const empty = newMug(o.size);
  assert.equal(reaction(grade(o, empty).score), 'bad');
  assert.equal(grade(o, newBowl()).score, 0, 'pasta for a cocoa order');
});

test('pouring: two flavors mix, too much spills', () => {
  const m = newMug('small');
  pour(m, 'classic', 0.4); pour(m, 'peppermint', 0.2);
  assert.equal(m.flavor, 'mixed');
  assert.equal(pour(m, 'classic', 1), true);
  assert.equal(m.fill, FILL_SPILL);
  assert.match(addTopping(m, 'cream'), /spilled/);
});

test('toppings need cocoa / noodles first, and counts top out', () => {
  assert.match(addTopping(newMug('big'), 'cream'), /Pour/);
  assert.match(addTopping(newBowl(), 'gumdrops'), /Noodles/);
  const m = newMug('big'); pour(m, 'classic', 0.9);
  for (let i = 0; i < 5; i++) assert.equal(addTopping(m, 'mallows'), '');
  assert.notEqual(addTopping(m, 'mallows'), '');
  assert.notEqual(addTopping(m, 'mallows'), '');
  assert.equal(addTopping(m, 'cane'), '');
  assert.notEqual(addTopping(m, 'cane'), '');
});

test('noodles: crunchy, then perfect, then mushy', () => {
  assert.equal(cookState(2), 'crunchy');
  assert.equal(cookState(7), 'perfect');
  assert.equal(cookState(12), 'mushy');
});

test('the schedule: a good fast order outweighs the wait between customers', () => {
  for (const day of [1, 12, 24]) {
    const R = dayRules(day);
    const drainBetween = drainPerSecond(day, 1) * R.spawnEvery;
    assert.ok(serveBoost(1, 0.6) > drainBetween * 0.9, `day ${day}: ${serveBoost(1, 0.6)} vs ${drainBetween}`);
  }
  assert.equal(starsFor(0), 0); assert.equal(starsFor(90), 3);
});

test('flavors unlock over the month', () => {
  assert.deepEqual(unlocked(FLAVORS, 1).map((f) => f.id), ['classic']);
  assert.equal(unlocked(FLAVORS, 24).length, 3);
});
