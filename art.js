// All drawing: SVG strings built in code (no image files).
import { FLAVORS, SAUCES, FILL_OK } from './data.js';

const svg = (vb, inner, cls = '') => `<svg viewBox="${vb}" class="${cls}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
const INK = '#3b2417';
const flavorColor = (id) => (id === 'mixed' ? '#8a6a52' : FLAVORS.find((f) => f.id === id)?.color ?? '#6b3a1f');
const sauceColor = (id) => SAUCES.find((s) => s.id === id)?.color ?? '#b3203b';

// ---------- Faces ----------
// Storybook style: big eyes with heavy lids that droop as patience runs out.
// mood: 'happy' | 'waiting' | 'grumpy' | 'yay' | 'yuck'
// One eyelid: covers the eye (cx, cy, r) from the top down to heights yl
// (left edge) and yr (right edge), given as 0 (open) .. 2 (shut) radii.
function lid(cx, cy, r, yl, yr, skin) {
  const pt = (side, d) => {
    const y = cy - r + d * r;
    const dx = Math.sqrt(Math.max(0, r * r - (y - cy) ** 2));
    return [cx + side * dx, y];
  };
  const [lx, ly] = pt(-1, yl), [rx, ry] = pt(1, yr);
  const big = (yl + yr) / 2 > 1 ? 1 : 0;
  return `<path d="M${lx} ${ly} A${r} ${r} 0 ${big} 1 ${rx} ${ry} Z" fill="${skin}"/><path d="M${lx - 1} ${ly} L${rx + 1} ${ry}" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`;
}
function eyes(cx, cy, gap, r, mood, skin) {
  const L = cx - gap, Rx = cx + gap;
  if (mood === 'yay') {
    return `<path d="M${L - r} ${cy + 2} q${r} ${-r * 1.5} ${2 * r} 0 M${Rx - r} ${cy + 2} q${r} ${-r * 1.5} ${2 * r} 0" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  }
  // Where the pupils look, and how far the lids come down (inner, outer).
  const look = { happy: [0.5, 1], waiting: [-2.2, 0.5], grumpy: [0, 1.6], yuck: [1, 0.4] }[mood] || [0, 1];
  const lids = { happy: [0.45, 0.45], waiting: [0.95, 0.95], grumpy: [1.15, 0.55], yuck: [1.2, 1.2] }[mood] || [0.4, 0.4];
  let out = '';
  for (const [x, side] of [[L, -1], [Rx, 1]]) {
    out += `<circle cx="${x}" cy="${cy}" r="${r}" fill="#fffdf6" stroke="${INK}" stroke-width="1.8"/>`;
    out += `<circle cx="${x + look[0]}" cy="${cy + look[1]}" r="${r * 0.48}" fill="${INK}"/><circle cx="${x + look[0] - r * 0.18}" cy="${cy + look[1] - r * 0.2}" r="${r * 0.15}" fill="#fff"/>`;
    // Grumpy lids slope down toward the nose.
    const [inner, outer] = lids;
    out += side < 0 ? lid(x, cy, r, outer, inner, skin) : lid(x, cy, r, inner, outer, skin);
  }
  if (mood === 'grumpy') out += `<path d="M${L - r - 1} ${cy - r - 4} L${L + r} ${cy - r + 3} M${Rx + r + 1} ${cy - r - 4} L${Rx - r} ${cy - r + 3}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
  else if (mood === 'waiting') out += `<path d="M${L - r} ${cy - r - 3} q${r} -3 ${2 * r} 0 M${Rx - r} ${cy - r - 7} q${r} -4 ${2 * r} 1" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  else out += `<path d="M${L - r} ${cy - r - 4} q${r} -5 ${2 * r} -1 M${Rx - r} ${cy - r - 5} q${r} -4 ${2 * r} 1" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  return out;
}
function mouth(cx, my, mood, w = 9) {
  return {
    happy: `<path d="M${cx - w} ${my} q${w} ${w * 0.9} ${2 * w} -1" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
    yay: `<path d="M${cx - w - 2} ${my - 2} q${w + 2} ${w * 1.6} ${2 * w + 4} 0 z" fill="#7a1f2b" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="M${cx - w * 0.5} ${my + w * 0.55} q${w * 0.5} ${-w * 0.35} ${w} 0" fill="#e2687a"/>`,
    waiting: `<path d="M${cx - w * 0.8} ${my + 2} q${w * 0.4} -2 ${w * 0.8} 0 q${w * 0.4} 2 ${w * 0.8} 0" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
    grumpy: `<path d="M${cx - w} ${my + 4} q${w} ${-w * 0.9} ${2 * w} 1" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
    yuck: `<path d="M${cx - w} ${my + 2} q${w * 0.5} -4 ${w} 0 q${w * 0.5} 4 ${w} 0" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M${cx + 1} ${my + 3} q${w * 0.4} ${w * 0.9} ${w * 0.8} 0" fill="#e2687a" stroke="${INK}" stroke-width="1.4"/>`,
  }[mood] || '';
}
// A soft shadow crescent on the right of a round shape (storybook shading).
const shade = (cx, cy, rx, ry, k = 0.6, op = 0.13) =>
  `<path d="M${cx} ${cy - ry} A${rx} ${ry} 0 0 1 ${cx} ${cy + ry} A${rx * k} ${ry} 0 0 0 ${cx} ${cy - ry}Z" fill="#000" opacity="${op}"/>`;
const shine = (x, y, rx, ry, op = 0.35) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${op}"/>`;

export function elf(c, mood = 'happy') {
  const flush = mood === 'grumpy' ? `<ellipse cx="60" cy="86" rx="26" ry="22" fill="#e0403a" opacity=".22"/>` : '';
  return svg('0 0 120 160', `
    <path d="M18 160 q2 -40 24 -50 q18 -6 36 0 q22 10 24 50 z" fill="${c.outfit}" stroke="${INK}" stroke-width="2"/>
    <path d="M60 112 v48" stroke="#000" stroke-width="22" opacity=".08"/>
    <path d="M34 116 q8 8 13 0 q6 8 13 0 q7 8 13 0 q6 8 13 0 l-4 -8 q-22 -8 -44 0 z" fill="#f6ecd6" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
    <circle cx="60" cy="136" r="3.2" fill="#e6b54a" stroke="${INK}" stroke-width="1.2"/><circle cx="60" cy="149" r="3.2" fill="#e6b54a" stroke="${INK}" stroke-width="1.2"/>
    <path d="M36 80 q-22 -6 -32 -26 q20 4 36 16 z M84 80 q22 -6 32 -26 q-20 4 -36 16 z" fill="${c.skin}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M30 64 q-12 -4 -18 -12 M90 64 q12 -4 18 -12" stroke="#000" stroke-width="2" opacity=".12" fill="none"/>
    <ellipse cx="60" cy="82" rx="27" ry="30" fill="${c.skin}" stroke="${INK}" stroke-width="2"/>
    ${shade(60, 82, 27, 30)}${flush}
    <path d="M34 66 q4 -10 14 -8 q-2 -8 12 -8 q12 0 12 8 q10 -2 14 8 q-8 -4 -14 -1 q-6 -5 -12 -2 q-8 -4 -14 2 q-6 -3 -12 1z" fill="${c.hair}"/>
    ${eyes(60, 80, 10, 7.5, mood, c.skin)}
    <ellipse cx="62" cy="93" rx="7" ry="6" fill="${c.skin}" stroke="${INK}" stroke-width="1.8"/><ellipse cx="60" cy="91" rx="2.4" ry="1.6" fill="#fff" opacity=".6"/>
    <circle cx="42" cy="96" r="5" fill="#ff7a7a" opacity="${mood === 'grumpy' ? 0 : 0.35}"/><circle cx="80" cy="96" r="5" fill="#ff7a7a" opacity="${mood === 'grumpy' ? 0 : 0.35}"/>
    ${mouth(60, 103, mood, 8)}
    <path d="M30 62 q30 -14 60 0 l-2 8 q-28 -10 -56 0 z" fill="#f6ecd6" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M33 62 q4 -26 22 -42 q14 -12 24 -6 q10 6 4 16 q-6 8 -2 14 q4 6 12 4 q-4 10 -14 6 q-8 -4 -6 -14 q2 -8 -4 -10 q-8 -2 -14 10 q-6 12 -6 24 z" fill="${c.hat}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M44 56 q4 -18 16 -30" stroke="#fff" stroke-width="3" opacity=".25" fill="none" stroke-linecap="round"/>
    <circle cx="97" cy="44" r="7" fill="#f6ecd6" stroke="${INK}" stroke-width="1.8"/>
  `, 'char');
}

export function reindeer(c, mood = 'happy') {
  const antler = (dir) => {
    const x = 60 + dir * 16;
    const d = `M${x} 40 q${dir * 4} -14 ${dir * 2} -26 q${dir * -2} -10 ${dir * 6} -14 M${x + dir * 2} 26 q${dir * 10} -2 ${dir * 18} -12 q${dir * 4} -6 ${dir * 2} -10 M${x + dir * 3} 16 q${dir * -8} -4 ${dir * -8} -12`;
    return `<path d="${d}" stroke="${INK}" stroke-width="8.5" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#e1c595" stroke-width="5.5" fill="none" stroke-linecap="round"/>`;
  };
  const flush = mood === 'grumpy' ? `<ellipse cx="60" cy="72" rx="24" ry="20" fill="#e0403a" opacity=".2"/>` : '';
  return svg('0 0 120 160', `
    ${antler(-1)}${antler(1)}
    <path d="M16 160 q2 -38 26 -48 q18 -6 36 0 q24 10 26 48 z" fill="${c.fur}" stroke="${INK}" stroke-width="2"/>
    <path d="M60 112 v48" stroke="#000" stroke-width="24" opacity=".08"/>
    <path d="M32 118 q28 14 56 0 l2 12 q-30 14 -60 0 z" fill="#b8283f" stroke="${INK}" stroke-width="1.8"/>
    <path d="M40 122 l4 12 M52 126 l2 12 M66 126 l-1 12 M78 122 l-3 12" stroke="#f6ecd6" stroke-width="3.5"/>
    <path d="M70 128 q4 16 -2 30 l12 -2 q4 -14 0 -28z" fill="#b8283f" stroke="${INK}" stroke-width="1.8"/>
    <path d="M34 60 q-26 -14 -30 0 q8 12 32 8 z M86 60 q26 -14 30 0 q-8 12 -32 8 z" fill="${c.fur}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M14 58 q8 2 16 6 M106 58 q-8 2 -16 6" stroke="#f1c9a0" stroke-width="3" stroke-linecap="round"/>
    <path d="M60 36 q28 0 28 34 q0 22 -6 36 q-8 12 -22 12 q-14 0 -22 -12 q-6 -14 -6 -36 q0 -34 28 -34z" fill="${c.fur}" stroke="${INK}" stroke-width="2"/>
    ${shade(60, 77, 28, 41, 0.6, 0.12)}${flush}
    <path d="M60 40 q-8 0 -6 8 q2 6 6 6 q4 0 6 -6 q2 -8 -6 -8z" fill="#f6ecd6" opacity=".35"/>
    ${eyes(60, 66, 11, 8, mood, c.fur)}
    <ellipse cx="60" cy="98" rx="19" ry="15" fill="#efd9b8" stroke="${INK}" stroke-width="1.8"/>
    <ellipse cx="60" cy="90" rx="9" ry="6.5" fill="${c.nose}" stroke="${INK}" stroke-width="1.6"/><ellipse cx="57" cy="88" rx="3" ry="1.6" fill="#fff" opacity=".5"/>
    ${mouth(60, 102, mood, 7)}
  `, 'char');
}

// ---------- Cocoa mug (glass, so you can see how full it is) ----------
const MUG = {
  small: { x: 58, w: 80, top: 92, bot: 182 },
  big: { x: 46, w: 104, top: 58, bot: 182 },
};
// bare: just the shapes, in a 200 x 200 space, for placing inside a scene.
export function mug(item, { showLine = true, bare = false } = {}) {
  if (!item && bare) return '';
  if (!item) return svg('0 0 200 200', `<ellipse cx="100" cy="186" rx="70" ry="8" fill="#000" opacity=".12"/>
    <text x="100" y="110" text-anchor="middle" class="hint-text">pick a mug</text>`);
  const m = MUG[item.size];
  const inner = { x: m.x + 6, w: m.w - 12, top: m.top + 6, bot: m.bot - 8 };
  const h = inner.bot - inner.top;
  const level = Math.min(1, item.fill);
  const surf = inner.bot - h * level;
  const col = flavorColor(item.flavor);
  const cx = m.x + m.w / 2;
  let out = `<ellipse cx="${cx}" cy="${m.bot + 4}" rx="${m.w * 0.62}" ry="7" fill="#000" opacity=".12"/>`;
  // Handle.
  out += `<path d="M${m.x + m.w - 2} ${m.top + 20} q34 0 34 ${(m.bot - m.top) * 0.35} q0 ${(m.bot - m.top) * 0.3} -34 ${(m.bot - m.top) * 0.35}" fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round"/><path d="M${m.x + m.w - 2} ${m.top + 20} q34 0 34 ${(m.bot - m.top) * 0.35} q0 ${(m.bot - m.top) * 0.3} -34 ${(m.bot - m.top) * 0.35}" fill="none" stroke="#b8283f" stroke-width="9.5" stroke-linecap="round"/>`;
  // Cocoa.
  if (item.fill > 0) {
    out += `<rect x="${inner.x}" y="${surf}" width="${inner.w}" height="${inner.bot - surf}" rx="6" fill="${col}"/>`;
    out += `<ellipse cx="${cx}" cy="${surf}" rx="${inner.w / 2}" ry="4" fill="${col}" stroke="#fff" stroke-opacity=".25"/>`;
  }
  // Glass.
  out += `<rect x="${m.x}" y="${m.top}" width="${m.w}" height="${m.bot - m.top}" rx="12" fill="#e8f6ff" fill-opacity=".14" stroke="${INK}" stroke-width="2.6"/>`;
  out += `<path d="M${m.x + 10} ${m.top + 14} v${(m.bot - m.top) * 0.6}" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".6"/>`;
  // The fill line: fill to here.
  if (showLine && !item.spilled) {
    const okY = inner.bot - h * FILL_OK, fullY = inner.top;
    out += `<rect x="${m.x + 2}" y="${fullY}" width="${m.w - 4}" height="${okY - fullY}" fill="#7bdc7b" opacity="${item.fill > 0.02 ? 0.12 : 0.2}"/>`;
    out += `<path d="M${m.x + 2} ${okY} h${m.w - 4}" stroke="#2f8f4e" stroke-width="2.5" stroke-dasharray="6 5"/>`;
  }
  // Spilled: running down the sides into a puddle.
  if (item.spilled) {
    out += `<path d="M${m.x - 2} ${m.top} q-6 30 -2 60 q4 20 -2 ${m.bot - m.top - 70} M${m.x + m.w + 2} ${m.top} q6 40 2 ${m.bot - m.top - 10}" stroke="${col}" stroke-width="9" fill="none" stroke-linecap="round"/>`;
    out += `<ellipse cx="${cx}" cy="${m.bot + 5}" rx="${m.w * 0.75}" ry="9" fill="${col}"/>`;
  }
  // Toppings sit on top of the cocoa (or the cream).
  const t = item.toppings;
  let top = surf;
  if (t.cane) out += cane(m.x + m.w - 22, surf, m.top);
  if (t.cream) {
    const cy = Math.min(surf, m.top + 6);
    const k = Math.round(inner.w / 18);
    for (let i = 0; i <= k; i++) out += `<circle cx="${inner.x + 2 + (i * (inner.w - 4)) / k}" cy="${cy - 2 - (i % 2) * 4}" r="11" fill="#fffaf2" stroke="${INK}" stroke-width="2.2"/>`;
    out += `<circle cx="${cx}" cy="${cy - 14}" r="12" fill="#fffaf2" stroke="${INK}" stroke-width="2.2"/><circle cx="${cx + 3}" cy="${cy - 26}" r="6" fill="#fffaf2" stroke="${INK}" stroke-width="2.2"/>`;
    out += `<rect x="${inner.x}" y="${cy - 8}" width="${inner.w}" height="10" fill="#fffaf2"/>`;
    top = cy - 18;
  }
  const n = t.mallows;
  for (let i = 0; i < n; i++) {
    const x = cx - (n - 1) * 9 + i * 18 + (i % 2 ? 2 : -2), y = top - 6 - (i % 2) * 7;
    out += `<rect x="${x - 7}" y="${y - 6}" width="14" height="12" rx="4" fill="#fff" stroke="${INK}" stroke-width="1.8" transform="rotate(${(i * 23) % 30 - 15} ${x} ${y})"/>`;
  }
  if (t.sprinkles) {
    const cols = ['#e63946', '#2f8f4e', '#f2c230', '#3a6fb3', '#ff8ac0'];
    for (let i = 0; i < 16; i++) {
      const x = inner.x + 6 + ((i * 37) % (inner.w - 12)), y = top - 2 - ((i * 13) % 12);
      out += `<rect x="${x}" y="${y}" width="6" height="2.4" rx="1.2" fill="${cols[i % 5]}" transform="rotate(${(i * 47) % 180} ${x + 3} ${y + 1})"/>`;
    }
  }
  if (t.drizzle) {
    let d = `M${inner.x + 4} ${top + 2}`;
    const steps = 8, sw = (inner.w - 8) / steps;
    for (let i = 1; i <= steps; i++) d += ` L${inner.x + 4 + i * sw} ${top + 2 - (i % 2) * 10}`;
    out += `<path d="${d}" stroke="#5a2e14" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  if (t.cookie) out += gingerbread(m.x - 6, m.top - 14, 0.9);
  return bare ? out : svg('0 0 200 200', out);
}
function cane(x, bottom, top) {
  const y0 = Math.min(bottom, top + 40) + 10;
  const len = y0 - (top - 34);
  return `<g><path d="M${x} ${y0} v${-len} q0 -16 -14 -16 q-12 0 -12 12" stroke="#fff" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M${x} ${y0} v${-len} q0 -16 -14 -16 q-12 0 -12 12" stroke="#d6243a" stroke-width="9" fill="none" stroke-linecap="round" stroke-dasharray="5 6"/>
    <path d="M${x} ${y0} v${-len} q0 -16 -14 -16 q-12 0 -12 12" stroke="${INK}" stroke-width="1.2" fill="none" opacity=".4" transform="translate(4.5 0)"/></g>`;
}
function gingerbread(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M20 4 a9 9 0 1 1 0.1 0 M10 20 h20 l12 8 l-4 6 l-8 -4 v10 l8 14 l-6 4 l-10 -12 l-6 0 l-10 12 l-6 -4 l8 -14 v-10 l-8 4 l-4 -6 z" fill="#b8733a" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="17" cy="12" r="1.5" fill="${INK}"/><circle cx="23" cy="12" r="1.5" fill="${INK}"/>
    <path d="M16 16 q4 3 8 0" stroke="#fff" stroke-width="1.5" fill="none"/>
    <circle cx="20" cy="26" r="1.8" fill="#e63946"/><circle cx="20" cy="33" r="1.8" fill="#2f8f4e"/></g>`;
}

// ---------- Pasta ----------
const NOODLE_COLOR = { crunchy: '#f4e1a4', perfect: '#f0bf55', mushy: '#d9cfa4' };
function noodles(type, cook, cx, cy, w) {
  const col = NOODLE_COLOR[cook] || NOODLE_COLOR.perfect;
  let out = '';
  if (type === 'spaghetti') {
    for (let i = 0; i < 9; i++) {
      const x = cx - w / 2 + 10 + (i * (w - 20)) / 8, y = cy - 6 + (i % 3) * 5;
      const wig = cook === 'crunchy' ? 0 : cook === 'mushy' ? 3 : 9;
      out += `<path d="M${x - 22} ${y} q11 ${-wig} 22 0 q11 ${wig} 22 0" stroke="${INK}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      out += `<path d="M${x - 22} ${y} q11 ${-wig} 22 0 q11 ${wig} 22 0" stroke="${col}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
    }
  } else {
    const pos = [[-40, 2], [-20, -6], [0, 4], [20, -5], [40, 3], [-30, -14], [10, -14], [30, -15], [-8, -22], [-48, -6], [48, -8]];
    for (const [dx, dy] of pos) {
      const x = cx + (dx * w) / 120, y = cy + dy;
      if (type === 'bowties') out += `<path d="M${x - 9} ${y - 6} l9 6 l9 -6 v12 l-9 -6 l-9 6 z" fill="${col}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><circle cx="${x}" cy="${y}" r="2.4" fill="${col}" stroke="${INK}" stroke-width="1.2"/>`;
      else out += `<path d="M${x - 9} ${y + 5} q0 -14 9 -14 q9 0 9 14 q-9 -5 -18 0z" fill="${col}" stroke="${INK}" stroke-width="1.8"/><path d="M${x - 4} ${y + 2} l2 -8 M${x} ${y + 1} v-9 M${x + 4} ${y + 2} l-2 -8" stroke="${INK}" stroke-width="1" opacity=".5"/>`;
    }
  }
  if (cook === 'mushy') out += `<ellipse cx="${cx}" cy="${cy + 4}" rx="${w * 0.42}" ry="10" fill="#cfc59a" opacity=".55"/>`;
  return out;
}
const TOP_SPOTS = [[-40, -8], [-14, -20], [16, -16], [40, -6], [-26, 4], [4, 0], [28, 6], [-4, -30], [-46, 6], [46, 10]];
function pastaToppings(t, cx, cy) {
  let out = '';
  let k = 0;
  const spot = () => { const [dx, dy] = TOP_SPOTS[k++ % TOP_SPOTS.length]; return [cx + dx, cy + dy]; };
  if (t.carrot) for (let i = 0; i < 3; i++) { const [x, y] = spot(); out += `<path d="M${x - 8} ${y} q4 -8 8 0 q4 8 8 0 q4 -8 8 0" stroke="#f08a24" stroke-width="4" fill="none" stroke-linecap="round"/>`; }
  if (t.crumbles) for (let i = 0; i < 12; i++) { const x = cx - 48 + ((i * 41) % 96), y = cy - 24 + ((i * 17) % 28); out += `<rect x="${x}" y="${y}" width="5" height="4" fill="${i % 2 ? '#fff' : '#d6243a'}" stroke="${INK}" stroke-width=".6" transform="rotate(${i * 31} ${x} ${y})"/>`; }
  if (t.chips) for (let i = 0; i < 8; i++) { const x = cx - 44 + ((i * 29) % 88), y = cy - 20 + ((i * 23) % 26); out += `<path d="M${x} ${y - 6} q5 6 4 8 q-4 3 -8 0 q-1 -2 4 -8z" fill="#4a2512"/>`; }
  const gumCols = ['#e63946', '#2f8f4e', '#f2c230', '#8a3fa8', '#ff8ac0'];
  for (let i = 0; i < (t.gumdrops || 0); i++) { const [x, y] = spot(); out += `<path d="M${x - 8} ${y + 5} q0 -15 8 -15 q8 0 8 15 z" fill="${gumCols[i % 5]}" stroke="${INK}" stroke-width="1.8"/><circle cx="${x - 3}" cy="${y - 4}" r="1.2" fill="#fff"/><circle cx="${x + 2}" cy="${y}" r="1" fill="#fff"/>`; }
  for (let i = 0; i < (t.peppermints || 0); i++) { const [x, y] = spot(); out += peppermint(x, y, 9); }
  return out;
}
export function peppermint(x, y, r) {
  let out = `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${INK}" stroke-width="1.8"/>`;
  for (let a = 0; a < 6; a += 2) {
    const a0 = (a * Math.PI) / 3, a1 = ((a + 1) * Math.PI) / 3;
    out += `<path d="M${x} ${y} L${x + Math.cos(a0) * r * 0.9} ${y + Math.sin(a0) * r * 0.9} A${r * 0.9} ${r * 0.9} 0 0 1 ${x + Math.cos(a1) * r * 0.9} ${y + Math.sin(a1) * r * 0.9} z" fill="#d6243a"/>`;
  }
  return out;
}
export function bowl(item, { bare = false } = {}) {
  if (!item && bare) item = { noodle: null, sauce: null, toppings: {} };
  if (!item) return svg('0 0 200 160', `<ellipse cx="100" cy="150" rx="70" ry="7" fill="#000" opacity=".12"/>
    <text x="100" y="90" text-anchor="middle" class="hint-text">drain noodles here</text>`);
  let out = `<ellipse cx="100" cy="150" rx="74" ry="8" fill="#000" opacity=".12"/>`;
  out += `<path d="M22 86 q6 60 78 60 q72 0 78 -60 z" fill="#f6ecd6" stroke="${INK}" stroke-width="2.6"/>`;
  out += `<path d="M30 108 q70 26 140 0 l-3 9 q-67 25 -134 0z" fill="#b8283f"/><path d="M120 92 q42 0 54 -6 q-4 40 -40 54 q22 -22 -14 -48z" fill="#000" opacity=".1"/>`;
  out += `<ellipse cx="100" cy="86" rx="78" ry="16" fill="#e9dcc0" stroke="${INK}" stroke-width="2.6"/>`;
  if (item.noodle) out += noodles(item.noodle, item.cook, 100, 80, 140);
  if (item.sauce) out += `<path d="M58 76 q10 -22 42 -20 q34 -2 44 20 q-8 10 -42 10 q-36 0 -44 -10z" fill="${sauceColor(item.sauce)}" stroke="${INK}" stroke-width="2" opacity=".93"/>`;
  out += pastaToppings(item.toppings, 100, 70);
  return bare ? out : svg('0 0 200 160', out);
}
export function pot(noodle, cook, { bare = false } = {}) {
  let out = `<ellipse cx="100" cy="166" rx="80" ry="9" fill="#000" opacity=".15"/>
    <path d="M86 168 l-6 10 M114 168 l6 10" stroke="#555" stroke-width="5"/>
    <rect x="58" y="164" width="84" height="8" rx="3" fill="#3d3d3d"/>
    <path d="M30 72 h-14 M170 72 h14" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
    <path d="M30 66 h140 v80 q0 22 -22 22 h-96 q-22 0 -22 -22z" fill="#c9774a" stroke="${INK}" stroke-width="2.6"/>
    <path d="M128 66 h42 v80 q0 22 -22 22 h-16 q16 -10 -4 -102z" fill="#000" opacity=".16"/>
    <rect x="40" y="76" width="9" height="70" rx="4.5" fill="#ffd9b0" opacity=".5"/>
    <path d="M30 98 h140" stroke="#8a4526" stroke-width="3" opacity=".5"/>
    <ellipse cx="100" cy="64" rx="74" ry="14" fill="#d98a5a" stroke="${INK}" stroke-width="2.6"/>
    <ellipse cx="100" cy="66" rx="64" ry="9" fill="#a9d8e6" stroke="#8a4526" stroke-width="1.5"/>`;
  if (noodle) {
    out += `<g class="bubbles">${[40, 70, 100, 125, 150].map((x, i) => `<circle cx="${x}" cy="${60 + (i % 2) * 4}" r="${4 + (i % 3)}" fill="#e9f7ff" stroke="#fff" style="animation-delay:${i * 0.17}s"/>`).join('')}</g>`;
    const col = NOODLE_COLOR[cook] || NOODLE_COLOR.crunchy;
    if (noodle === 'spaghetti') out += `<path d="M78 60 l-8 -34 M90 58 l-2 -38 M104 58 l4 -36 M116 60 l10 -32" stroke="${col}" stroke-width="5" stroke-linecap="round"/>`;
    else out += noodles(noodle, cook, 100, 56, 100);
    out += `<g class="steam"><path d="M70 30 q-8 -10 0 -20 q8 -10 0 -20 M100 24 q-8 -10 0 -20 q8 -10 0 -20 M130 30 q-8 -10 0 -20 q8 -10 0 -20" stroke="#fff" stroke-width="4" fill="none" opacity=".7" stroke-linecap="round"/></g>`;
  }
  return bare ? out : svg('0 -20 200 200', out);
}

// ---------- Ticket and button icons (40 x 40) ----------
const ic = (inner) => svg('0 0 40 40', inner, 'icon');
export const ICONS = {
  small: ic(`<rect x="11" y="16" width="16" height="18" rx="4" fill="#dff3ff" stroke="${INK}" stroke-width="2.4"/><path d="M27 20 q7 0 7 5 q0 5 -7 5" stroke="#c8283c" stroke-width="3.4" fill="none"/>`),
  big: ic(`<rect x="7" y="6" width="22" height="30" rx="5" fill="#dff3ff" stroke="${INK}" stroke-width="2.4"/><path d="M29 12 q8 0 8 8 q0 8 -8 8" stroke="#c8283c" stroke-width="3.6" fill="none"/>`),
  flavor: (id) => ic(`<path d="M8 14 h24 l-3 20 q-9 4 -18 0 z" fill="${flavorColor(id)}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>${id === 'peppermint' ? peppermint(20, 10, 6) : ''}${id === 'white' ? '<circle cx="20" cy="24" r="3" fill="#fff" stroke="#d8c9a8"/>' : ''}`),
  cream: ic(`<path d="M6 30 q-3 -10 8 -12 q0 -10 10 -9 q8 -8 14 2 q6 4 -2 19 z" fill="#fffaf2" stroke="${INK}" stroke-width="2.2"/>`),
  mallows: ic(`<rect x="5" y="16" width="14" height="13" rx="4" fill="#fff" stroke="${INK}" stroke-width="2"/><rect x="19" y="11" width="15" height="13" rx="4" fill="#fff" stroke="${INK}" stroke-width="2" transform="rotate(12 26 17)"/><rect x="15" y="24" width="14" height="12" rx="4" fill="#fff" stroke="${INK}" stroke-width="2"/>`),
  cane: ic(`<path d="M24 36 v-22 q0 -9 -7 -9 q-7 0 -7 7" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M24 36 v-22 q0 -9 -7 -9 q-7 0 -7 7" stroke="#d6243a" stroke-width="6" fill="none" stroke-linecap="round" stroke-dasharray="3.5 4"/>`),
  sprinkles: ic(['#e63946', '#2f8f4e', '#f2c230', '#3a6fb3', '#ff8ac0', '#e63946', '#2f8f4e', '#3a6fb3'].map((c, i) => `<rect x="${7 + (i * 11) % 24}" y="${8 + (i * 7) % 24}" width="9" height="3.4" rx="1.7" fill="${c}" transform="rotate(${i * 50} ${11 + (i * 11) % 24} ${10 + (i * 7) % 24})"/>`).join('')),
  drizzle: ic(`<path d="M5 22 l6 -8 l6 10 l6 -10 l6 10 l6 -8" stroke="#5a2e14" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`),
  cookie: ic(gingerbread(7, 2, 0.62)),
  spaghetti: ic(`<path d="M4 14 q8 -6 16 0 q8 6 16 0 M4 22 q8 -6 16 0 q8 6 16 0 M4 30 q8 -6 16 0 q8 6 16 0" stroke="#f0bf55" stroke-width="4" fill="none" stroke-linecap="round"/>`),
  bowties: ic(`<path d="M6 12 l14 9 l14 -9 v18 l-14 -9 l-14 9 z" fill="#f0bf55" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><circle cx="20" cy="21" r="3.5" fill="#f0bf55" stroke="${INK}" stroke-width="1.8"/>`),
  shells: ic(`<path d="M6 30 q0 -22 14 -22 q14 0 14 22 q-14 -8 -28 0z" fill="#f0bf55" stroke="${INK}" stroke-width="2.2"/><path d="M14 26 l3 -12 M20 25 v-14 M26 26 l-3 -12" stroke="${INK}" stroke-width="1.4" opacity=".6"/>`),
  sauce: (id) => ic(`<path d="M20 5 q12 16 12 23 a12 12 0 0 1 -24 0 q0 -7 12 -23z" fill="${sauceColor(id)}" stroke="${INK}" stroke-width="2.4"/>`),
  gumdrops: ic(`<path d="M5 32 q0 -18 10 -18 q10 0 10 18z" fill="#e63946" stroke="${INK}" stroke-width="2"/><path d="M17 34 q0 -18 10 -18 q10 0 10 18z" fill="#2f8f4e" stroke="${INK}" stroke-width="2"/>`),
  peppermints: ic(peppermint(20, 20, 14)),
  chips: ic(`<path d="M12 8 q7 9 6 12 q-6 4 -12 0 q-1 -3 6 -12z M28 18 q7 9 6 12 q-6 4 -12 0 q-1 -3 6 -12z" fill="#4a2512"/>`),
  carrot: ic(`<path d="M6 20 q5 -10 9 0 q5 10 9 0 q5 -10 9 0" stroke="#f08a24" stroke-width="5" fill="none" stroke-linecap="round"/>`),
  crumbles: ic([0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${7 + (i * 13) % 26}" y="${8 + (i * 9) % 24}" width="7" height="6" fill="${i % 2 ? '#fff' : '#d6243a'}" stroke="${INK}" stroke-width="1" transform="rotate(${i * 33} ${10 + (i * 13) % 26} ${11 + (i * 9) % 24})"/>`).join('')),
  trash: ic(`<path d="M10 12 h20 l-2 24 h-16 z" fill="#9aa5ad" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/><path d="M7 11 h26 M16 7 h8" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`),
};

// ---------- The toy line (the schedule) ----------
export const TOYS = [
  ic(`<rect x="8" y="10" width="24" height="24" rx="3" fill="#e63946" stroke="${INK}" stroke-width="2.4"/><text x="20" y="28" font-size="16" font-weight="900" text-anchor="middle" fill="#fff" font-family="sans-serif">A</text>`),
  ic(`<circle cx="20" cy="20" r="13" fill="#3a6fb3" stroke="${INK}" stroke-width="2.4"/><path d="M7 20 h26 M20 7 q8 13 0 26" stroke="#f2c230" stroke-width="3" fill="none"/>`),
  ic(`<rect x="6" y="14" width="28" height="18" rx="2" fill="#2f8f4e" stroke="${INK}" stroke-width="2.4"/><path d="M20 14 v18 M6 23 h28" stroke="#f2c230" stroke-width="3.5"/><path d="M20 14 q-8 -10 -10 -2 q4 2 10 2 q8 -10 10 -2 q-4 2 -10 2" fill="none" stroke="#f2c230" stroke-width="2.4"/>`),
  ic(`<path d="M8 30 v-12 h16 v-6 h8 v18 z" fill="#f2c230" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/><circle cx="13" cy="32" r="4" fill="${INK}"/><circle cx="27" cy="32" r="4" fill="${INK}"/>`),
  ic(`<circle cx="20" cy="14" r="7" fill="#c49766" stroke="${INK}" stroke-width="2.2"/><circle cx="14" cy="8" r="3" fill="#c49766" stroke="${INK}" stroke-width="1.8"/><circle cx="26" cy="8" r="3" fill="#c49766" stroke="${INK}" stroke-width="1.8"/><ellipse cx="20" cy="29" rx="9" ry="8" fill="#c49766" stroke="${INK}" stroke-width="2.2"/>`),
];
