// Everything on the menu, everyone who comes to the counter, and how each day
// gets harder. Meant to be edited by hand: add a topping here and it shows up
// on the buttons, on tickets and in grading (draw it in art.js too).

// ---------- Cocoa (the elves) ----------
export const MUG_SIZES = [
  { id: 'small', name: 'Small mug' },
  { id: 'big', name: 'Big mug' },
];
export const FLAVORS = [
  { id: 'classic', name: 'Classic', color: '#6b3a1f', from: 1 },
  { id: 'peppermint', name: 'Peppermint', color: '#a8505a', from: 3 },
  { id: 'white', name: 'White', color: '#f3e4c4', from: 5 },
];
// type 'bool' = on or off; 'count' = how many (each tap adds one).
// from = the first day it can be ordered.
export const COCOA_TOPPINGS = [
  { id: 'cream', name: 'Whipped cream', type: 'bool', from: 1 },
  { id: 'mallows', name: 'Marshmallows', type: 'count', max: 5, from: 1 },
  { id: 'cane', name: 'Candy cane', type: 'bool', from: 1 },
  { id: 'sprinkles', name: 'Sprinkles', type: 'bool', from: 2 },
  { id: 'drizzle', name: 'Choc drizzle', type: 'bool', from: 4 },
  { id: 'cookie', name: 'Gingerbread', type: 'bool', from: 6 },
];
// Pour to the dashed line: at least FILL_OK, and past FILL_SPILL it overflows.
export const FILL_OK = 0.8;
export const FILL_SPILL = 1.05;
export const POUR_RATE = 0.6; // of a mug per second while you hold Pour

// ---------- Candy pasta (the reindeer) ----------
export const NOODLES = [
  { id: 'spaghetti', name: 'Spaghetti', from: 2 },
  { id: 'bowties', name: 'Bow-ties', from: 2 },
  { id: 'shells', name: 'Shells', from: 5 },
];
export const SAUCES = [
  { id: 'cranberry', name: 'Cranberry', color: '#b3203b', from: 2 },
  { id: 'alfredo', name: 'Snowy Alfredo', color: '#f6efdc', from: 2 },
  { id: 'pesto', name: 'Mint Pesto', color: '#5fb36b', from: 4 },
];
export const PASTA_TOPPINGS = [
  { id: 'gumdrops', name: 'Gumdrops', type: 'count', max: 5, from: 2 },
  { id: 'peppermints', name: 'Peppermints', type: 'count', max: 4, from: 2 },
  { id: 'chips', name: 'Choc chips', type: 'bool', from: 3 },
  { id: 'carrot', name: 'Carrot curls', type: 'bool', from: 3 },
  { id: 'crumbles', name: 'Cane crumbles', type: 'bool', from: 5 },
];
// Noodles boil from 0 s: crunchy before COOK_PERFECT[0], perfect in the
// window, mushy after it.
export const COOK_PERFECT = [6, 9.5];

// ---------- Customers ----------
export const ELVES = [
  { name: 'Tinsel', outfit: '#2f8f4e', hat: '#c8283c', skin: '#f6cfa8', hair: '#7a4a24' },
  { name: 'Pip', outfit: '#c8283c', hat: '#2f8f4e', skin: '#e9b48c', hair: '#2b1d14' },
  { name: 'Sprocket', outfit: '#3a6fb3', hat: '#f2c230', skin: '#f6cfa8', hair: '#d9a441' },
  { name: 'Jingle', outfit: '#8a3fa8', hat: '#2f8f4e', skin: '#c98d62', hair: '#2b1d14' },
  { name: 'Holly', outfit: '#2f8f4e', hat: '#f2f2f2', skin: '#f2c6a0', hair: '#b5452b' },
  { name: 'Nutmeg', outfit: '#d9732b', hat: '#c8283c', skin: '#8d5a3b', hair: '#1c120c' },
  { name: 'Bingle', outfit: '#c8283c', hat: '#3a6fb3', skin: '#f6cfa8', hair: '#e8d7a0' },
  { name: 'Twinkle', outfit: '#1f8a8a', hat: '#c8283c', skin: '#e9b48c', hair: '#5a3418' },
];
// The eight reindeer from the 1823 poem, plus a few of their cousins.
export const REINDEER = [
  { name: 'Dasher', fur: '#8a5a33', nose: '#2b1d14' },
  { name: 'Dancer', fur: '#a0703f', nose: '#2b1d14' },
  { name: 'Prancer', fur: '#7a4a28', nose: '#2b1d14' },
  { name: 'Vixen', fur: '#94603a', nose: '#3a2418' },
  { name: 'Cupid', fur: '#b07d4c', nose: '#d0566e' },
  { name: 'Donner', fur: '#6e4224', nose: '#2b1d14' },
  { name: 'Blitzen', fur: '#9a6b42', nose: '#2b1d14' },
  { name: 'Juniper', fur: '#c49766', nose: '#2b1d14' },
  { name: 'Maple', fur: '#8f4f2a', nose: '#2b1d14' },
];

export const LAST_DAY = 24; // December 24th: get through it and Christmas is saved
export const SEATS = 3;

// How a day plays. day is 1 (Dec 1) .. 24.
export function dayRules(day) {
  const d = Math.max(1, Math.min(LAST_DAY, day));
  return {
    shift: 120, // seconds in a shift
    spawnEvery: Math.max(7, 15 - d * 0.4), // a new customer this often (while a seat is free)
    firstAfter: 1.5,
    patience: Math.max(30, 58 - d * 1.3), // seconds before they give up and leave
    // Share of patience left when their face changes (so they look upset early).
    moodAt: { waiting: 0.72, grumpy: 0.4 },
    pastaShare: d < 2 ? 0 : Math.min(0.5, 0.3 + d * 0.01), // chance a customer is a reindeer
    // How many toppings an order asks for.
    cocoaToppings: [1, Math.min(4, 1 + Math.floor((d + 1) / 3))],
    pastaToppings: [1, Math.min(3, 1 + Math.floor(d / 4))],
    maxCount: Math.min(5, 2 + Math.floor(d / 3)), // most marshmallows/gumdrops in one order
    drain: 0.55 + d * 0.035, // schedule meter lost per second, just from time passing (out of 100)
    waitDrain: 0.12, // extra per second for each customer waiting
  };
}
