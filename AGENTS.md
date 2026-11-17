# Comet's Cocoa

A family order-up game set in Santa's Workshop: you're Comet the reindeer, running the snack counter.
Elves order hot cocoa (mug size, flavor, fill to the line, toppings); reindeer order candy pasta
(noodles boiled just right, sauce, candy toppings). Serve them fast and right or the workshop's
**toy schedule** falls behind. Started 2026-11-16. It's in the order-up / time-management genre, but an
original game: don't copy any existing game's look, characters, stations or names.
Kid-friendly and cartoonish; must work on phones and computers.

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
- `art.js`: all drawing as SVG strings: elves and reindeer with moods, the glass mug (so you can see
  the fill line), the bowl, the pot, ticket/button icons, toys for the belt.
- `sound.js`: Web Audio synth, no files (iPhone unlock copied from GGROBAR / Witch's Brew).
- `game.js`: state, loop, counter, stations, screens. `style.css`, `index.html`.

## How it plays

- Dec 1 to Dec 24, one 2-minute shift a day. Dec 1 is cocoa only (the pasta station is hidden);
  reindeer and pasta arrive Dec 2. New items unlock on set days and are shown on the day's intro card.
- Up to 3 customers at the counter, each with a ticket (icons, red badge = how many) and a patience
  bar; their face goes from happy to waiting to grumpy. Run out and they leave (schedule penalty).
- **Cocoa:** pick a mug (a non-empty mug must be served or tossed first), **hold** a flavor tap to
  pour (`POUR_RATE`), stop between the dashed line (`FILL_OK`) and the brim; past `FILL_SPILL` it
  overflows and has to be tossed. Two flavors = "mixed". Toppings need cocoa in first.
- **Pasta:** tap a noodle to start the pot (one batch at a time), drain while the cook bar is green
  (`COOK_PERFECT` seconds), then sauce (one) and toppings. The pot keeps going while you're at the
  Cocoa Bar; on phones the Pasta tab shows its countdown / "ready!".
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
