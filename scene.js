// The two kitchen stations drawn as scenes: a back counter with a mug shelf, the
// cocoa machine and topping jars; a stove with the pasta pot, noodle canisters,
// sauce bottles and candy jars. Each scene is one SVG (520 x 440, counter top at
// y = 330). Anything you can tap is a <g class="hit" data-act="...">; game.js
// listens on the whole SVG and fills the slots (#mug-slot, #pot-slot, ...).
import { MUG_SIZES, FLAVORS, COCOA_TOPPINGS, NOODLES, SAUCES, PASTA_TOPPINGS, COOK_PERFECT } from './data.js';
import { mug, bowl, pot, ICONS, peppermint } from './art.js';

export const W = 520, H = 440, TOP = 330;
const INK = '#3b2417';
export const COOK_SPAN = COOK_PERFECT[1] + 4; // the cook dial's full sweep, in seconds

// ---------- Small pieces ----------
// An icon (40 x 40 art) placed at x, y with size s.
const icon = (art, x, y, s) => art.replace('<svg ', `<svg x="${x}" y="${y}" width="${s}" height="${s}" `);

function defs(p) {
  return `<defs>
    <pattern id="${p}-paper" width="44" height="44" patternUnits="userSpaceOnUse">
      <rect width="44" height="44" fill="#1f5a63"/>
      <rect width="22" height="44" fill="#22616a"/>
      <path d="M11 8 q5 -6 9 0 q-4 6 -9 0z M33 30 q5 -6 9 0 q-4 6 -9 0z" fill="#e6b54a" opacity=".22"/>
      <circle cx="33" cy="9" r="1.6" fill="#f6ecd6" opacity=".22"/><circle cx="11" cy="31" r="1.6" fill="#f6ecd6" opacity=".22"/>
    </pattern>
    <linearGradient id="${p}-brass" x1="0" x2="1"><stop offset="0" stop-color="#f3d27a"/><stop offset=".45" stop-color="#e2ac44"/><stop offset="1" stop-color="#9c6a22"/></linearGradient>
    <linearGradient id="${p}-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a4128"/><stop offset="1" stop-color="#4a2516"/></linearGradient>
    <linearGradient id="${p}-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf3e2"/><stop offset="1" stop-color="#e3d2b0"/></linearGradient>
    <radialGradient id="${p}-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
    <linearGradient id="${p}-glass" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".3" stop-color="#e8f6ff" stop-opacity=".18"/><stop offset="1" stop-color="#bfe0ee" stop-opacity=".3"/></linearGradient>
  </defs>`;
}

// Wall, counter top and counter front, stretched far past the edges so wide or
// tall screens just see more of the room.
function room(p) {
  return `<rect x="-2000" y="-2000" width="4520" height="${2000 + TOP}" fill="url(#${p}-paper)"/>
    <rect x="-2000" y="${TOP - 48}" width="4520" height="48" fill="#000" opacity=".12"/>
    <rect x="-2000" y="${TOP}" width="4520" height="2000" fill="url(#${p}-wood)"/>
    <rect x="-2000" y="${TOP - 4}" width="4520" height="16" rx="4" fill="url(#${p}-top)"/>
    <rect x="-2000" y="${TOP + 12}" width="4520" height="5" fill="#e6b54a"/>
    <rect x="-2000" y="${TOP + 17}" width="4520" height="5" fill="#000" opacity=".2"/>
    ${[-1, 0, 1, 2].map((i) => `<rect x="${i * 180 + 14}" y="${TOP + 32}" width="152" height="140" rx="16" fill="none" stroke="#2e170e" stroke-width="3" opacity=".45"/>`).join('')}`;
}

// A wooden shelf with curly brackets. Labels go on its front edge.
function shelf(x1, x2, y, labels = []) {
  const br = (x, dir) => `<path d="M${x} ${y + 12} q${dir * 0} 22 ${dir * 16} 24 q${dir * 6} 0 ${dir * 6} -6 q0 -5 ${dir * -5} -5" stroke="#4a2516" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  return `${br(x1 + 14, 1)}${br(x2 - 14, -1)}
    <rect x="${x1}" y="${y}" width="${x2 - x1}" height="13" rx="3" fill="#8a4f2a" stroke="#3a1f16" stroke-width="2"/>
    <rect x="${x1 + 2}" y="${y + 1}" width="${x2 - x1 - 4}" height="3" fill="#c98a55" opacity=".7"/>
    ${labels.map(([x, t]) => `<text x="${x}" y="${y + 11}" class="shelf-label">${t}</text>`).join('')}`;
}
const counterLabel = (x, t) => `<text x="${x}" y="${TOP + 8}" class="counter-label">${t}</text>`;

// ---------- Containers (drawn with the bottom centre at 0, 0) ----------
function jar(contents, lid, w = 46, h = 54) {
  return `<ellipse cx="0" cy="0" rx="${w / 2 + 2}" ry="4" fill="#000" opacity=".2"/>
    <path d="M${-w / 2} -8 v${-(h - 22)} q0 -6 6 -8 h${w - 12} q6 2 6 8 v${h - 22} q0 8 -8 8 h${-(w - 16)} q-8 0 -8 -8z" fill="#e8f6ff" fill-opacity=".2" stroke="${INK}" stroke-width="2"/>
    ${icon(contents, -w / 2 + 5, -h + 14, w - 10)}
    <path d="M${-w / 2} -8 v${-(h - 22)} q0 -6 6 -8 h${w - 12} q6 2 6 8 v${h - 22} q0 8 -8 8 h${-(w - 16)} q-8 0 -8 -8z" fill="url(#jar-glass)" opacity=".7"/>
    <rect x="${-w / 2 + 5}" y="${-h + 16}" width="5" height="${h - 30}" rx="2.5" fill="#fff" opacity=".55"/>
    <rect x="${-w / 2 + 2}" y="${-h}" width="${w - 4}" height="11" rx="3" fill="${lid}" stroke="${INK}" stroke-width="2"/>
    <rect x="${-w / 2 + 4}" y="${-h + 2}" width="${w - 8}" height="3" rx="1.5" fill="#fff" opacity=".35"/>`;
}
function canister(contents, h = 72) {
  const w = 46;
  return `<ellipse cx="0" cy="0" rx="26" ry="4" fill="#000" opacity=".2"/>
    <rect x="${-w / 2}" y="${-h + 12}" width="${w}" height="${h - 12}" rx="8" fill="#e8f6ff" fill-opacity=".2" stroke="${INK}" stroke-width="2"/>
    ${icon(contents, -18, -h + 18, 36)}${icon(contents, -18, -h + 36, 36)}
    <rect x="${-w / 2}" y="${-h + 12}" width="${w}" height="${h - 12}" rx="8" fill="url(#jar-glass)" opacity=".7"/>
    <rect x="${-w / 2 + 5}" y="${-h + 18}" width="5" height="${h - 30}" rx="2.5" fill="#fff" opacity=".55"/>
    <path d="M-17 ${-h + 13} l2 -13 h30 l2 13z" fill="#c9965e" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="0" cy="${-h - 3}" r="5" fill="#a87442" stroke="${INK}" stroke-width="1.8"/>`;
}
function squeeze(color, h = 64) {
  return `<ellipse cx="0" cy="0" rx="18" ry="4" fill="#000" opacity=".2"/>
    <path d="M-15 -4 v${-(h - 30)} q0 -8 8 -8 h14 q8 0 8 8 v${h - 30} q0 4 -4 4 h-22 q-4 0 -4 -4z" fill="${color}" stroke="${INK}" stroke-width="2"/>
    <path d="M5 -8 v${-(h - 36)}" stroke="#000" stroke-width="7" opacity=".14" stroke-linecap="round"/>
    <path d="M-10 -10 v${-(h - 38)}" stroke="#fff" stroke-width="3.5" opacity=".35" stroke-linecap="round"/>
    <rect x="-14" y="${-h / 2 - 8}" width="28" height="16" rx="3" fill="#f6ecd6" stroke="${INK}" stroke-width="1.4"/>
    <path d="M-9 ${-(h - 26)} h18 l-2 -7 h-14z" fill="#f6ecd6" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M-3 ${-(h - 19)} l2 -13 h2 l2 13z" fill="#f6ecd6" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
    <rect x="-2" y="${-h - 1}" width="4" height="6" rx="1" fill="${color}" stroke="${INK}" stroke-width="1.2"/>`;
}
function shaker(contents) {
  return `<ellipse cx="0" cy="0" rx="20" ry="4" fill="#000" opacity=".2"/>
    <path d="M-16 -4 v-40 q0 -6 6 -6 h20 q6 0 6 6 v40 q0 4 -4 4 h-24 q-4 0 -4 -4z" fill="#e8f6ff" fill-opacity=".2" stroke="${INK}" stroke-width="2"/>
    ${icon(contents, -14, -44, 28)}${icon(contents, -14, -28, 28)}
    <path d="M-16 -4 v-40 q0 -6 6 -6 h20 q6 0 6 6 v40 q0 4 -4 4 h-24 q-4 0 -4 -4z" fill="url(#jar-glass)" opacity=".7"/>
    <path d="M-15 -50 q0 -16 15 -16 q15 0 15 16z" fill="#c9cfd4" stroke="${INK}" stroke-width="2"/>
    <path d="M-5 -58 h2 M2 -60 h2 M-8 -54 h2 M6 -55 h2 M-1 -54 h2" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`;
}
function cream() {
  return `<ellipse cx="0" cy="0" rx="18" ry="4" fill="#000" opacity=".2"/>
    <rect x="-15" y="-52" width="30" height="52" rx="5" fill="#f6ecd6" stroke="${INK}" stroke-width="2"/>
    <path d="M-15 -40 h30 M-15 -14 h30" stroke="#b8283f" stroke-width="5"/>
    <path d="M5 -50 v46" stroke="#000" stroke-width="8" opacity=".1"/>
    <path d="M-11 -52 q0 -8 11 -8 q11 0 11 8z" fill="#c9cfd4" stroke="${INK}" stroke-width="2"/>
    <path d="M-3 -60 l1 -8 h6 l4 -3 v6 l-4 -1 l-1 6z" fill="#f6ecd6" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
    ${icon(ICONS.cream, -11, -36, 22)}`;
}
function caneCup() {
  const c = (x, h, flip) => `<g transform="translate(${x} 0) scale(${flip ? -1 : 1} 1)"><path d="M0 -12 v${-h} q0 -10 -8 -10 q-8 0 -8 7" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M0 -12 v${-h} q0 -10 -8 -10 q-8 0 -8 7" stroke="#d6243a" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="4 5"/></g>`;
  return `<ellipse cx="0" cy="0" rx="22" ry="4" fill="#000" opacity=".2"/>
    ${c(-6, 30, false)}${c(6, 38, true)}${c(0, 22, false)}
    <path d="M-20 -30 h40 l-4 26 q0 4 -4 4 h-24 q-4 0 -4 -4z" fill="#2f8f4e" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M-19 -24 h38" stroke="#e6b54a" stroke-width="3"/><path d="M8 -28 l-3 26" stroke="#000" stroke-width="7" opacity=".12"/>`;
}
function tin() {
  return `<ellipse cx="0" cy="0" rx="28" ry="4" fill="#000" opacity=".2"/>
    <path d="M-26 -26 h52 v20 q0 6 -6 6 h-40 q-6 0 -6 -6z" fill="#b8283f" stroke="${INK}" stroke-width="2"/>
    <path d="M-26 -18 h52" stroke="#e6b54a" stroke-width="3"/>
    <path d="M-10 -24 l3 4 l3 -4 l3 4 l3 -4 l3 4 l3 -4" stroke="#f6ecd6" stroke-width="1.5" fill="none" opacity=".7"/>
    ${icon(ICONS.cookie, -14, -58, 30)}
    <path d="M-28 -28 q2 -10 30 -14 q24 -2 26 2 l-2 6 q-28 -2 -54 10z" fill="#c8384f" stroke="${INK}" stroke-width="2" stroke-linejoin="round" transform="rotate(-8 -28 -28)"/>`;
}

// What each item sits in, and its lid colour.
const LOOK = {
  cream: () => cream(),
  mallows: () => jar(ICONS.mallows, '#8fd3c1'),
  cane: () => caneCup(),
  sprinkles: () => shaker(ICONS.sprinkles),
  drizzle: () => squeeze('#5a2e14', 60),
  cookie: () => tin(),
  gumdrops: () => jar(ICONS.gumdrops, '#b8283f'),
  peppermints: () => jar(ICONS.peppermints, '#2f8f4e'),
  chips: () => jar(ICONS.chips, '#e6b54a'),
  carrot: () => jar(ICONS.carrot, '#8fd3c1'),
  crumbles: () => shaker(ICONS.crumbles),
};

// A tappable thing at x (centre), y (bottom). Locked items are greyed out with
// the day they arrive.
function item(act, x, y, art, { locked = 0, badge = '', w = 56, h = 76 } = {}) {
  return `<g transform="translate(${x} ${y})"><g class="hit${locked ? ' locked' : ''}" data-act="${act}"${locked ? ` data-locked="${locked}"` : ''}>
    <rect x="${-w / 2}" y="${-h}" width="${w}" height="${h + 6}" fill="transparent"/>
    <g class="art">${art}</g>
    ${locked ? `<g class="lock"><rect x="-21" y="-30" width="42" height="17" rx="8.5" fill="#3a1f16" opacity=".85"/><text x="0" y="-17.5" class="lock-text">Dec ${locked}</text></g>` : ''}
    ${badge ? `<g class="badge" data-badge="${badge}" transform="translate(${w / 2 - 8} ${-h + 10})"></g>` : ''}
  </g></g>`;
}
const lockedOn = (thing, day) => ((thing.from ?? 1) > day ? thing.from : 0);

// The count / tick badge on a topping container (filled in by game.js).
export function badge(v) {
  if (!v) return '';
  if (v === true) return `<circle r="10" fill="#2f8f4e" stroke="#fff" stroke-width="2.4"/><path d="M-5 0 l3.5 4 l6.5 -8" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `<circle r="10.5" fill="#b8283f" stroke="#fff" stroke-width="2.4"/><text y="4.6" class="badge-text">${v}</text>`;
}

function trash(x, y) {
  return item('trash', x, y, `<ellipse cx="0" cy="0" rx="24" ry="5" fill="#000" opacity=".25"/>
    <path d="M-19 -50 h38 l-4 46 q0 4 -4 4 h-22 q-4 0 -4 -4z" fill="#9aa5ad" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M-9 -42 l1 34 M0 -42 v34 M9 -42 l-1 34" stroke="${INK}" stroke-width="1.6" opacity=".4"/>
    <path d="M6 -48 l-2 46" stroke="#000" stroke-width="8" opacity=".1"/>
    <rect x="-23" y="-57" width="46" height="9" rx="4" fill="#b7c2cc" stroke="${INK}" stroke-width="2.2"/>
    <path d="M-6 -57 q0 -7 6 -7 q6 0 6 7" fill="none" stroke="${INK}" stroke-width="2.4"/>`, { w: 54, h: 66 });
}
function lantern(x, y) {
  return `<g transform="translate(${x} ${y})">
    <circle cx="0" cy="-30" r="38" fill="url(#jar-glow)" class="flicker"/>
    <ellipse cx="0" cy="0" rx="18" ry="3.5" fill="#000" opacity=".2"/>
    <path d="M-14 -4 v-36 h28 v36z" fill="#ffdf96" fill-opacity=".45" stroke="${INK}" stroke-width="2"/>
    <rect x="-4" y="-22" width="8" height="18" rx="2" fill="#f6ecd6"/><path d="M0 -24 q-4 -6 0 -11 q4 5 0 11z" fill="#ffb03a" class="flicker"/>
    <path d="M-17 -40 h34 l-7 -9 h-20z" fill="#2f8f4e" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M-17 -4 h34" stroke="#2f8f4e" stroke-width="5" stroke-linecap="round"/>
    <path d="M-5 -49 q5 -10 10 0" stroke="${INK}" stroke-width="2.2" fill="none"/></g>`;
}
// A painted sign hanging on the wall, a little crooked.
function sign(x, y, text, rot) {
  return `<g transform="translate(${x} ${y}) rotate(${rot})">
    <path d="M-30 -22 L0 -44 L30 -22" stroke="${INK}" stroke-width="1.6" fill="none"/><circle cx="0" cy="-45" r="3" fill="#e6b54a" stroke="${INK}" stroke-width="1.4"/>
    <path d="M-58 -24 q58 -10 116 0 l4 34 q-62 10 -124 0z" fill="#b8283f" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M-52 -18 q52 -8 104 0 l3 24 q-55 8 -110 0z" fill="none" stroke="#e6b54a" stroke-width="1.6"/>
    <text x="0" y="3" class="sign-text">${text}</text></g>`;
}

// ---------- The cocoa station ----------
const TAP_X = [190, 230, 270];
export const MUG_AT = { x: 230, s: 0.6 };
export function cocoaScene(day) {
  let out = defs('c') + `<defs><linearGradient id="jar-glass" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#9fc7d6" stop-opacity=".35"/></linearGradient>
    <radialGradient id="jar-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".5"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
    <clipPath id="globe-clip"><circle cx="230" cy="92" r="38"/></clipPath></defs>`;
  out += room('c');
  // Mug shelf, left.
  out += shelf(10, 136, 150, [[45, 'Small'], [104, 'Big']]);
  const blank = (size) => ({ size, fill: 0, flavor: null, spilled: false, toppings: {} });
  out += item('mug:small', 45, 150, `<g transform="translate(${-100 * 0.42} ${-186 * 0.42}) scale(.42)">${mug(blank('small'), { showLine: false, bare: true })}</g>`, { w: 50, h: 52 });
  out += item('mug:big', 104, 150, `<g transform="translate(${-100 * 0.42} ${-186 * 0.42}) scale(.42)">${mug(blank('big'), { showLine: false, bare: true })}</g>`, { w: 56, h: 66 });
  out += sign(72, 236, 'Cocoa', -4);
  out += lantern(70, TOP);

  // The cocoa machine: a brass contraption with a glass globe of cocoa on top.
  out += `<g class="machine">
    <ellipse cx="230" cy="${TOP + 2}" rx="96" ry="6" fill="#000" opacity=".22"/>
    <path d="M268 60 q20 -10 18 -34 q0 -10 10 -12" stroke="${INK}" stroke-width="13" fill="none" stroke-linecap="round"/>
    <path d="M268 60 q20 -10 18 -34 q0 -10 10 -12" stroke="url(#c-brass)" stroke-width="8" fill="none" stroke-linecap="round"/>
    <g class="steam slow"><path d="M300 6 q-8 -8 0 -16 q8 -8 0 -16" stroke="#fff" stroke-width="4" fill="none" opacity=".55" stroke-linecap="round"/></g>
    <circle cx="230" cy="92" r="40" fill="#e8f6ff" fill-opacity=".25" stroke="${INK}" stroke-width="2.4"/>
    <g clip-path="url(#globe-clip)"><g class="slosh"><path d="M150 96 q10 -6 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 V140 H150z" fill="#6b3a1f"/></g>
      <circle cx="212" cy="112" r="3" fill="#a0603a" class="rise"/><circle cx="242" cy="120" r="2.4" fill="#a0603a" class="rise d2"/></g>
    <path d="M204 66 q8 -14 22 -16" stroke="#fff" stroke-width="5" fill="none" opacity=".6" stroke-linecap="round"/>
    <path d="M196 128 h68 l8 14 h-84z" fill="url(#c-brass)" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M150 ${TOP} V160 q0 -18 18 -18 h124 q18 0 18 18 V${TOP} h-20 V230 q0 -10 -10 -10 h-100 q-10 0 -10 10 V${TOP}z" fill="url(#c-brass)" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
    <rect x="172" y="222" width="116" height="${TOP - 222}" fill="#3a2418" opacity=".32"/>
    <path d="M150 ${TOP} V160 q0 -18 18 -18 h8 q-14 4 -14 22 V${TOP}z" fill="#fff" opacity=".25"/>
    <path d="M152 214 h156" stroke="${INK}" stroke-width="2" opacity=".35"/>
    <circle cx="166" cy="168" r="11" fill="#f6ecd6" stroke="${INK}" stroke-width="2"/><path d="M160 172 a8 8 0 0 1 12 0" stroke="#b8283f" stroke-width="2" fill="none"/>
    <g class="gauge" style="transform-origin:166px 168px"><path d="M166 168 l-6 -5" stroke="${INK}" stroke-width="2" stroke-linecap="round"/></g>
    <rect x="176" y="${TOP - 10}" width="108" height="10" rx="2" fill="#7d8a93" stroke="${INK}" stroke-width="2"/>
    <path d="M186 ${TOP - 6} h88" stroke="${INK}" stroke-width="1.5" stroke-dasharray="4 4" opacity=".5"/>
    <path d="M222 222 h16 v6 q0 6 -5 8 v6 h-6 v-6 q-5 -2 -5 -8z" fill="#9c6a22" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
  </g>`;
  out += `<rect id="stream" x="225.5" y="242" width="9" height="${TOP - 248}" rx="3" fill="#6b3a1f" class="stream" visibility="hidden"/>`;
  out += `<g class="hit tray" data-act="tray"><rect x="176" y="236" width="108" height="${TOP - 236}" fill="transparent"/>
    <g id="mug-slot" transform="translate(${MUG_AT.x - 100 * MUG_AT.s} ${TOP - 10 - 186 * MUG_AT.s}) scale(${MUG_AT.s})"></g></g>`;
  // Taps: hold one to pour.
  FLAVORS.forEach((f, i) => {
    const x = TAP_X[i], locked = lockedOn(f, day);
    const knob = f.id === 'peppermint' ? `<circle cx="0" cy="-40" r="10" fill="#fff" stroke="${INK}" stroke-width="2"/>${peppermint(0, -40, 9)}`
      : `<circle cx="0" cy="-40" r="10" fill="${f.color}" stroke="${INK}" stroke-width="2"/><circle cx="-3" cy="-43" r="3" fill="#fff" opacity=".45"/>`;
    out += `<g transform="translate(${x} 200)"><g class="hit tap${locked ? ' locked' : ''}" data-act="tap:${f.id}"${locked ? ` data-locked="${locked}"` : ''}>
      <rect x="-19" y="-56" width="38" height="70" fill="transparent"/>
      <circle cx="0" cy="0" r="7" fill="#7d8a93" stroke="${INK}" stroke-width="2"/>
      <g class="lever"><rect x="-4" y="-34" width="8" height="34" rx="4" fill="#3a1f16"/>${knob}</g>
      <text x="0" y="17" class="tap-label">${f.name}</text>
      ${locked ? `<g class="lock"><rect x="-19" y="-48" width="38" height="16" rx="8" fill="#3a1f16" opacity=".85"/><text x="0" y="-36.5" class="lock-text">Dec ${locked}</text></g>` : ''}
    </g></g>`;
  });
  // Toppings: three on the counter, the later ones on the shelf above.
  out += shelf(334, 514, 150, COCOA_TOPPINGS.slice(3).map((t, i) => [362 + i * 60, t.name.split(' ')[0]]));
  COCOA_TOPPINGS.forEach((t, i) => {
    const x = 362 + (i % 3) * 60, y = i < 3 ? TOP : 150;
    out += item(`top:${t.id}`, x, y, LOOK[t.id](), { locked: lockedOn(t, day), badge: t.id, h: 70 });
    if (i < 3) out += counterLabel(x, t.name.split(' ')[0]);
  });
  out += trash(52, H - 14);
  return out;
}

// ---------- The pasta station ----------
export const BOWL_AT = { x: 330, s: 0.62 };
export function pastaScene(day) {
  let out = defs('p') + `<defs><linearGradient id="jar-glass" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#9fc7d6" stop-opacity=".35"/></linearGradient>
    <radialGradient id="jar-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".5"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>`;
  out += room('p');
  // Noodle canisters over the stove.
  out += shelf(10, 202, 120, NOODLES.map((n, i) => [45 + i * 61, n.name]));
  NOODLES.forEach((n, i) => { out += item(`noodle:${n.id}`, 45 + i * 61, 120, canister(ICONS[n.id]), { locked: lockedOn(n, day), w: 54, h: 80 }); });
  // Sauces, top right, with a round window between.
  out += `<g transform="translate(252 66)"><circle r="34" fill="#123c46" stroke="#4a2516" stroke-width="7"/>
    <path d="M-30 14 q14 -14 30 -6 q14 6 30 -4 v20 h-60z" fill="#f6ecd6" opacity=".9"/><circle cx="12" cy="-12" r="6" fill="#f6ecd6" opacity=".9"/>
    <path d="M-34 0 h68 M0 -34 v68" stroke="#4a2516" stroke-width="4"/><circle cx="-14" cy="-18" r="1.6" fill="#fff"/><circle cx="18" cy="6" r="1.4" fill="#fff"/></g>`;
  out += shelf(300, 514, 120, SAUCES.map((s, i) => [338 + i * 66, s.name.split(' ').pop()]));
  SAUCES.forEach((s, i) => { out += item(`sauce:${s.id}`, 338 + i * 66, 120, squeeze(s.color), { locked: lockedOn(s, day), w: 50, h: 74 }); });
  // Candy toppings on the lower shelf.
  out += shelf(214, 514, 222, PASTA_TOPPINGS.map((t, i) => [244 + i * 60, t.name.split(' ')[0]]));
  PASTA_TOPPINGS.forEach((t, i) => { out += item(`top:${t.id}`, 244 + i * 60, 222, LOOK[t.id](), { locked: lockedOn(t, day), badge: t.id, w: 56, h: 70 }); });
  // The stove: burner on the counter, the pot on it, the cook dial on the front.
  out += `<rect x="24" y="${TOP - 8}" width="166" height="10" rx="3" fill="#2e2e33" stroke="${INK}" stroke-width="2"/>
    <g id="flames" visibility="hidden">${[48, 68, 88, 108, 128, 148, 168].map((x, i) => `<path class="flame" style="animation-delay:${i * 0.11}s" d="M${x} ${TOP - 8} q-6 -8 0 -16 q6 8 0 16z" fill="${i % 2 ? '#ffb03a' : '#5fb8ff'}"/>`).join('')}</g>`;
  out += `<g class="hit pot" data-act="pot"><rect x="20" y="150" width="180" height="${TOP - 150}" fill="transparent"/>
    <g id="pot-slot" transform="translate(12 ${TOP - 16 - 168 * 0.95}) scale(.95)"></g></g>`;
  out += `<g id="pot-ready" visibility="hidden" transform="translate(107 136)"><g class="bob"><rect x="-50" y="-16" width="100" height="28" rx="14" fill="#2f8f4e" stroke="#f6ecd6" stroke-width="2.4"/><text y="4" class="ready-text">Tap to drain!</text></g></g>`;
  // Cook dial: crunchy, perfect (green), mushy.
  const ang = (t) => -180 + (Math.min(COOK_SPAN, t) / COOK_SPAN) * 180;
  const arc = (a0, a1, col) => {
    const r = 30, p = (a) => [107 + r * Math.cos((a * Math.PI) / 180), 400 + r * Math.sin((a * Math.PI) / 180)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `<path d="M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}" stroke="${col}" stroke-width="12" fill="none"/>`;
  };
  out += `<g class="dial"><rect x="61" y="354" width="92" height="62" rx="12" fill="#3a1f16" stroke="#e6b54a" stroke-width="2.4"/>
    <path d="M71 400 a36 36 0 0 1 72 0" fill="#f6ecd6"/>
    ${arc(-180, ang(COOK_PERFECT[0]), '#f0d98a')}${arc(ang(COOK_PERFECT[0]), ang(COOK_PERFECT[1]), '#4fbf6a')}${arc(ang(COOK_PERFECT[1]), 0, '#a38d6a')}
    <g id="dial-needle" style="transform-origin:107px 400px; transform: rotate(0deg)"><path d="M107 400 h-30" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/></g>
    <circle cx="107" cy="400" r="5" fill="#e6b54a" stroke="${INK}" stroke-width="2"/>
    <text x="107" y="413" class="dial-text">COOK</text></g>`;
  // The bowl, on the counter.
  out += `<g class="hit bowl" data-act="bowl"><rect x="${BOWL_AT.x - 70}" y="250" width="140" height="${TOP - 250}" fill="transparent"/>
    <g id="bowl-slot" transform="translate(${BOWL_AT.x - 100 * BOWL_AT.s} ${TOP + 2 - 152 * BOWL_AT.s}) scale(${BOWL_AT.s})"></g></g>`;
  out += trash(470, H - 14);
  return out;
}
export const potArt = (S) => (S ? pot(S.noodle, S.cook, { bare: true }) : pot(null, null, { bare: true }));
export const bowlArt = (b) => bowl(b, { bare: true });
export const mugArt = (m) => mug(m, { bare: true });
export const dialAngle = (t) => (Math.min(COOK_SPAN, t) / COOK_SPAN) * 180;

// ---------- Front of house (behind the customers) ----------
// A crooked arched window onto the snowy village at night, a garland of lights
// and two warm lamps. Drawn wide (1000 x 320) and cropped to fit.
export function frontRoom() {
  const snow = Array.from({ length: 34 }, (_, i) => {
    const x = 300 + ((i * 137) % 400), y = (i * 53) % 260, r = 1.4 + (i % 3) * 0.9;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" class="snow" style="animation-delay:${-(i * 0.37) % 6}s;animation-duration:${5 + (i % 4)}s"/>`;
  }).join('');
  const house = (x, y, w, h, roof, lean) => `<g transform="translate(${x} ${y}) rotate(${lean})">
    <rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" fill="#2b4f5a"/>
    <path d="M${-w / 2 - 6} ${-h} q${w / 2} ${-h * 0.9} ${w / 2 + 6} ${-h * 0.8} q${w / 2 - 4} ${h * 0.3} ${w / 2 + 6} ${h * 0.8}z" fill="#f6ecd6"/>
    <rect x="${-w / 4 - 5}" y="${-h * 0.62}" width="10" height="13" rx="3" fill="#ffcc5c" class="glowwin"/>
    <rect x="${w / 4 - 5}" y="${-h * 0.62}" width="10" height="13" rx="3" fill="#ffcc5c"/>
    <path d="M${roof} ${-h * 1.5} v${-h * 0.4}" stroke="#2b4f5a" stroke-width="6"/></g>`;
  const bulbs = Array.from({ length: 21 }, (_, i) => {
    const x = i * 50, y = 22 + Math.sin(((i % 5) / 5) * Math.PI) * 26;
    const col = ['#ff5a5a', '#ffd25a', '#6be0a8', '#7ab8ff'][i % 4];
    return `<g class="bulb" style="animation-delay:${(i % 4) * 0.4}s"><circle cx="${x}" cy="${y + 9}" r="9" fill="${col}" opacity=".35"/><ellipse cx="${x}" cy="${y + 9}" rx="4.5" ry="6.5" fill="${col}"/></g><rect x="${x - 3}" y="${y}" width="6" height="5" fill="#3a3a3a"/>`;
  }).join('');
  const lamp = (x) => `<g transform="translate(${x} 150)"><circle r="80" fill="url(#fr-glow)"/>
    <path d="M0 -40 v18" stroke="#3a1f16" stroke-width="4"/><path d="M-20 -22 h40 l-8 28 h-24z" fill="#e6b54a" stroke="#3a1f16" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="0" cy="7" rx="12" ry="4" fill="#fff3c4"/></g>`;
  return `<svg viewBox="0 0 1000 320" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg"><defs>
    <pattern id="fr-paper" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#6e1a28"/>
      <path d="M30 14 q8 8 0 16 q-8 -8 0 -16z M0 44 q8 8 0 16 q-8 -8 0 -16z M60 44 q8 8 0 16 q-8 -8 0 -16z" fill="#e6b54a" opacity=".16"/>
      <circle cx="30" cy="48" r="2" fill="#f6ecd6" opacity=".12"/><circle cx="0" cy="18" r="2" fill="#f6ecd6" opacity=".12"/></pattern>
    <linearGradient id="fr-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b2630"/><stop offset="1" stop-color="#1f5a63"/></linearGradient>
    <radialGradient id="fr-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".45"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
    <clipPath id="fr-win"><path d="M318 320 V120 q-4 -96 186 -100 q176 8 178 104 V320z"/></clipPath></defs>
    <rect width="1000" height="320" fill="url(#fr-paper)"/>
    <g clip-path="url(#fr-win)"><rect x="300" y="0" width="400" height="320" fill="url(#fr-sky)"/>
      <circle cx="610" cy="78" r="22" fill="#fff6d8"/><circle cx="620" cy="72" r="20" fill="#16404a"/>
      <circle cx="380" cy="80" r="1.6" fill="#fff"/><circle cx="450" cy="56" r="1.2" fill="#fff"/><circle cx="540" cy="96" r="1.4" fill="#fff"/><circle cx="660" cy="130" r="1.2" fill="#fff"/>
      <path d="M300 250 q80 -60 170 -20 q90 40 230 -30 V320 H300z" fill="#d9e8ea"/>
      ${house(390, 238, 44, 50, 10, -6)}${house(560, 226, 52, 64, -12, 5)}${house(640, 208, 36, 40, 6, -9)}
      <path d="M470 240 q-6 -40 4 -70 q10 -20 0 -40" stroke="#123c46" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M300 290 q120 -50 220 -10 q100 40 180 -10 V320 H300z" fill="#f6ecd6"/>
      ${snow}</g>
    <path d="M318 320 V120 q-4 -96 186 -100 q176 8 178 104 V320" fill="none" stroke="#3a1f16" stroke-width="20"/>
    <path d="M318 320 V120 q-4 -96 186 -100 q176 8 178 104 V320" fill="none" stroke="#e6b54a" stroke-width="5"/>
    <path d="M500 22 V320 M318 170 H682" stroke="#3a1f16" stroke-width="9"/>
    ${lamp(170)}${lamp(830)}
    <path d="M-10 18 ${Array.from({ length: 11 }, (_, i) => `Q${i * 100 + 25} 64 ${i * 100 + 50} 30 T${i * 100 + 100} 18`).join(' ')}" stroke="#1f5a3a" stroke-width="12" fill="none" stroke-linecap="round"/>
    <path d="M-10 18 ${Array.from({ length: 11 }, (_, i) => `Q${i * 100 + 25} 64 ${i * 100 + 50} 30 T${i * 100 + 100} 18`).join(' ')}" stroke="#2f8f4e" stroke-width="5" fill="none" stroke-dasharray="3 7" stroke-linecap="round"/>
    ${bulbs}</svg>`;
}
