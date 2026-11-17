# Comet's Cocoa

A family order-up game set in Santa's Workshop: you're Comet the reindeer, running the snack counter.
Elves order hot cocoa (mug size, flavor, fill to the line, toppings); reindeer order candy pasta
(noodles boiled just right, sauce, candy toppings). Serve them fast and right or the workshop's
**toy schedule** falls behind. Started 2026-11-16. It's in the order-up / time-management genre, but an
original game: don't copy any existing game's look, characters, stations or names.
Kid-friendly; must work on phones and computers. Look (2026-11-16 restyle, the user asked for an animated-
holiday-movie storybook feel, less cheesy): night teal, cranberry, brass and cream; curly, slightly
crooked shapes; warm lamp light; Gluten for display type, Fredoka for text. Inspired by that style only:
no characters, places or designs from any film.

## Run

```sh
python3 -m http.server 8770 --bind 127.0.0.1   # then open http://127.0.0.1:8770/
npm test                                        # logic tests (node --test)
node tools/drive.mjs tools/out/<name> "<query>" <ms,...> ['<input json>']   # headless Chrome screenshots
MOBILE=1 node tools/drive.mjs ...               # same, as a phone (390x844, touch)
```

`tools/drive.mjs` is Ry's Rad Waves' driver without WebGPU (port from `PORT`, default 8770). Input json
entries: `[ms, 'eval', '<js>']` is the handy one (click buttons, set `window.__S` state, call
`window.__serve(seat)`). URL options: `?day=N` opens that day's intro, `&go` starts it, `&seed=N` fixes
the random orders.

## Files

Static site, ES modules, no build step, no dependencies.
- `data.js`: **the menu and the difficulty, meant to be edited by hand.** Mug sizes, flavors, toppings,
  noodles, sauces (each with `from`: the first day it can be ordered), the customers (elves; the eight
  reindeer from the 1823 poem plus cousins; no Rudolph), and `dayRules(day)`: shift length, how often
  customers come, patience, share of reindeer, topping counts, schedule drain.
- `logic.js`: pure rules (tested): seeded rng, `makeOrder`, building (`newMug`, `pour`, `newBowl`,
  `addTopping`), `cookState` (crunchy → perfect → mushy), `grade` (score 0..1 plus friendly notes on
  what was wrong), the schedule (`serveBoost`, `LEAVE_PENALTY`, `drainPerSecond`, `starsFor`), coins.
- `art.js`: all drawing as SVG strings: elves and reindeer with moods (eyelids droop and brows knit as
  patience runs out), the glass mug (so you can see the fill line), the bowl, the pot, ticket icons,
  toys for the belt. `mug`/`bowl`/`pot` take `{ bare: true }` to return shapes for a scene.
- `scene.js`: the two stations as illustrated SVG scenes (520 x 440, counter top at y 330): the cocoa
  station (mug shelf, brass cocoa machine with a lever per flavor, topping containers on the counter
  and a shelf) and the pasta station (noodle canisters, stove + pot + cook dial, sauce bottles, candy
  jars, bowl). Tappable things are `<g class="hit" data-act="kind:id">`; game.js listens on the SVG.
  Items not unlocked yet show greyed with their day. Also `frontRoom()`, the backdrop behind the
  customers (arched window on a snowy village, garland, lamps).
- `sound.js`: Web Audio synth, no files (iPhone unlock copied from GGROBAR / Witch's Brew).
- `game.js`: state, loop, counter, stations, screens. `style.css`, `index.html`.

## How it plays

- Dec 1 to Dec 24, one 2-minute shift a day. Dec 1 is cocoa only (the pasta station is hidden);
  reindeer and pasta arrive Dec 2. New items unlock on set days and are shown on the day's intro card.
- Up to 3 customers at the counter, each with a pinned order slip (icons, red badge = how many) and a
  patience bar. Patience is `dayRules().patience` (58 s on Dec 1 down to 30 s); faces turn impatient
  at `moodAt.waiting` and grumpy (scowl, shaking, steam, grumble sound) at `moodAt.grumpy` of patience
  left. Run out and they leave (schedule penalty).
- **Cocoa:** tap a mug on the shelf (a non-empty mug must be served or tossed first), **hold** a lever
  on the cocoa machine to pour (`POUR_RATE`), stop between the dashed line (`FILL_OK`) and the brim;
  past `FILL_SPILL` it overflows and has to be tossed (bin under the counter). Two flavors = "mixed".
  Tap topping containers to add (badge shows count / tick). Toppings need cocoa in first.
- **Pasta:** tap a noodle canister to start the pot (one batch at a time), tap the pot to drain while
  the cook dial is green (`COOK_PERFECT` seconds), then tap a sauce bottle (one) and candy jars. The
  pot keeps going while you're at the cocoa station; on phones the Pasta tab shows its countdown.
- **Serve:** tap the customer. Whatever matches their kind (mug for elves, bowl for reindeer) goes to
  them; customers you could serve glow. They react (perfect / good / yuck with what was wrong),
  coins pop up.
- **Toy schedule** (HUD meter, out of 100, starts at 70): drains with time and faster for each
  customer waiting; served orders refill it, more for better and quicker ones. Empty = "The workshop
  fell behind!" (retry the day). Survive the shift for 1-3 stars (by how full it is). The toy belt
  under the HUD runs at a speed set by the meter.
- Progress (next day, total coins) in localStorage `comets-cocoa`. Coins aren't spent on anything yet.

All the balance numbers are first guesses, to be tuned after the family plays it.

## Ideas not done yet

Spending coins (decorations, faster taps), a third station (cookies?), Mrs. Claus or Santa as a
special customer, a combo order (cocoa + pasta), a leaderboard (Witch's Brew's Supabase pattern),
kids' art.
