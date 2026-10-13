# NUBHUB

The front door to the NUB games. Three cards, three games:

| Game | Where it lives | What it is |
| --- | --- | --- |
| **RummiNUB** | its own deployment — **not this repo** | Rummikub for two to four, with Khaltu Marwa's rules |
| **WordNUB** | `/wordle` | guess the five-letter word in six tries |
| **ConnectNUB** | `/connections` | find the four groups of four |

React + Vite, no runtime dependencies beyond React itself. Everything is
static: no server, no database, no accounts. Progress and streaks live in the
player's own browser.

## The look

`src/theme.css` is the house style, and every value in it is lifted from
RummiNUB's shipping build rather than invented: the crimson room
(`--crimson-deep #1a0206`), cream cards on `--cream #f4e9ce`, the red and green
button gradients, the segmented control with its sliding green pill, Source
Serif 4 for headings and Archivo for UI text, and one easing curve
(`cubic-bezier(.22,1,.36,1)`) used everywhere.

Games override only what is theirs. A WordNUB tile still has to read as green,
yellow or grey and a ConnectNUB category still has to read as yellow, green,
blue or purple — those are the games, not decoration — but they are warmed to
sit on cream and crimson instead of on white. Everything around them (header,
buttons, modals, toasts, keyboard) comes from the theme, so the four screens are
one site rather than four that happen to be linked.

There is no light/dark switch. The site is the one dark room, so a toggle could
only ever make one screen disagree with the rest.

## Sized for a laptop

Both games are laid out desktop-first and centred in the viewport.

WordNUB sizes the **tile**, not the board: `--tile` grows to fill whatever the
header and keyboard leave behind, capped at 84px. Sizing the tile is what keeps
every tile exactly square at any window height, and the board falls out of it.
The on-screen keyboard is always there and always clickable; the laptop keyboard
works at the same time, and both feed the same handler.

ConnectNUB uses a 720px board with tiles that scale on viewport height.

```bash
npm install && npm run dev
```

## The RummiNUB link

RummiNUB is a **separate project** with its own Netlify site and its own
Supabase database. Nothing here builds it, serves it, or can check that it is
up. The hub links out to it, and that address is a single constant:

```js
// src/games.js
export const RUMMINUB_URL = "https://rumminub.netlify.app";
```

If the RummiNUB card 404s, that line is the only thing to fix.

## How the daily puzzle works

Both games pick today's puzzle from a fixed list by counting days since a fixed
epoch (`src/lib/daily.js`), so everyone gets the same puzzle without a server
being involved.

The day turns over at **midnight in Belgium** (`Europe/Brussels`) — not at the
player's own midnight. Everyone everywhere flips to the new word and the new
board at the same instant, so someone waking up in Brussels finds a fresh puzzle
rather than yesterday's. A player in California sees it roll at 3 or 4pm their
time, which is why both end screens print `midnight in Belgium` under the
countdown along with what that works out to locally: a timer that runs out
mid-afternoon looks broken unless it says whose midnight it is.

**Nothing hardcodes an offset.** Belgium is UTC+1 in winter and UTC+2 in summer,
so a fixed `+1` would serve the wrong puzzle for half the year and a fixed `+2`
for the other half. The zone is resolved through `Intl.DateTimeFormat`, read via
`formatToParts` rather than by parsing a formatted string — the order and
punctuation of a formatted date are a locale's business and change without
warning.

Finding the next Belgian midnight takes two passes: the offset in force today,
then a correction in case the guess landed on the far side of a clock change.
Belgium changes its clocks at 02:00/03:00 and never at midnight, so the midnight
this resolves to always exists and is never ambiguous.

The tests cover both clock changes (a 25-hour October day and a 23-hour March
one) and run green from `Europe/Brussels`, `America/Los_Angeles`, `Asia/Tokyo`,
`Pacific/Kiritimati` (UTC+14), `Asia/Kathmandu` (UTC+5:45) and `UTC` — a suite
that only passes on the machine that wrote it would be worth nothing here.

Both lists wrap when they run out. **Append new entries at the end** — insert
one in the middle and every past puzzle number shifts under everyone who
already played it.

## The Netlify badge

Netlify pins a "Powered by Netlify" badge to the bottom-right of every page on
this plan. It is a fixed iframe at `z-index: 2147483645`, so nothing can be
layered over it and no stacking context will move it — the only answer is to
keep content out from under it. `--badge-safe` in `theme.css` is 72px below
1200px wide and 0 above, and the keyboard, board, boards and modals all reserve
it.

**Watch the shorthand.** A `padding: 0 6px 10px` in a narrow-screen media query
silently resets the clearance and puts the bottom keyboard row straight back
under the badge. Set `padding-bottom` with the variable, or include it in the
shorthand.

## Winning

`src/lib/Celebration.jsx` is RummiNUB's win screen, lifted so that winning feels
the same whichever of the three games you were playing: a flutter of kisses and
"Bisous!" over the whole page, and the result floating straight over the board
with no card and no panel.

The board stays readable underneath, because the first thing anyone wants after
a game is to look at how it ended. Tapping the shade tucks the result into a
pill at the top — thinned-out confetti, the headline, and the way through to the
stats, so putting the party aside never costs you the button.

### Two animation bugs worth remembering

**The flip was easing wrong.** `--ease` is `cubic-bezier(.22, 1, .36, 1)`, a
settle curve with overshoot — right for a button, wrong for a tile turning over,
because it throws the tile to edge-on inside the first fifth of the animation
and then crawls. It read as a blink, not a turn. A flip has to accelerate into
the edge and decelerate out of it, so each half of `wd-flip` now carries its own
`animation-timing-function`. The board also needs `perspective`; without it
`rotateX` is an orthographic squash and the tile flattens instead of rotating.

**Tapped keys stayed lit.** On a touch screen `:hover` sticks after a tap until
something else is pressed, which looks exactly like a stuck key. Every hover
rule on the site is now behind `@media (hover: hover)`, and the on-screen
keyboard blurs the button it just handled so a mouse click leaves no focus ring
either. `:focus-visible` still rings for keyboard users.

## WordNUB

`src/wordle/logic.js` holds the scoring and is where the subtle bugs live, so
it is pure and tested. Nothing in it assumes five letters — every function
takes its length from the words it is handed.

### Long Words

Settings has a word-length picker: 5 through 10. Each length is **its own
game** — its own daily word, its own saved board, its own streak and
distribution. Mixing a ten-letter run into a five-letter streak would make both
numbers meaningless.

Six guesses at every length. A ten-letter word is not five times harder than a
five-letter one, because each guess also reveals twice as many letters, and
keeping the row count fixed means a share grid and a distribution chart mean
the same thing whichever length you play.

The board sizes the **tile**, not the grid, from three ceilings — a comfortable
maximum, the height between header and keyboard, and the width the row needs —
so a ten-wide board shrinks its tiles instead of running off the screen.

### Suggesting a word

The card in Settings asks for the word twice and refuses to send unless the two
match. There is no spell-check to lean on and no way to correct a word once it
is in a list, so a single typo would quietly become somebody's unguessable
Tuesday; retyping catches exactly the mistake the sender cannot see.

It posts to **Netlify Forms**, so there is no backend. Two things make that
work, and both are easy to lose:

1. The hidden `<form name="word-suggestion">` in `index.html`. Netlify finds
   forms by scanning deployed HTML at build time and a React-rendered form is
   invisible to that scan.
2. **Form detection must be on for the site** (`ignore_html_forms: false`), and
   it only takes effect on the *next* deploy. Until then the POST returns 404.

`fetch` resolves happily on a 404, so the send path checks `res.ok` — without
it the card thanks someone for a word that went nowhere.

Scoring is **two passes**, and it has to be. Greens are claimed first, each one
consuming a letter from a pool of what the answer actually contains; only the
leftovers compete for yellows. Score left-to-right in one pass and guessing
`EERIE` against `BADGE` paints the leading E yellow even though the only E is
already green at the end — the board then reports an E that does not exist.

### The word lists

Two lists, for two different jobs.

**`answers.js`** — 1,243 curated solutions, about three and a half years' worth.
Every one is a word an ordinary person already knows, and plain plurals are kept
out: "it probably ends in S" is a guess that works far too often and it makes
the last row dull. The order is a seeded shuffle, then a pass that separates
neighbours starting with the same letter.

**`dict-<n>.js`** — the words a guess is allowed to be, one file per length,
from 18,510 at five letters to 220,222 at ten. **Generated — don't hand-edit
them.** Five is bundled because that is the game almost everyone opens; 6–10
are dynamic imports, so a player who never turns on Long Words never downloads
them (ten letters alone is 650KB gzipped, and the board says so while it
fetches).

Webster's is a lemma list with *inconsistent* inflections. It happens to carry
"running" and "quickly", but it has "embezzle" and "embezzler" and no
"embezzling", and it has no y-to-ies plurals at all. So `forms()` in
`scripts/build-words.mjs` derives every inflection from every base rather than
trusting what is listed: plurals, y→ies, silent-e dropping before `-ing`,
doubled consonants (`stopping`, `beginning`), `c`→`ck` (`panicking`), and the
`-ly`/`-ness` pair.

This deliberately over-generates — "catness" and "runly" come out of it too.
That is the right way round to be wrong. Accepting a non-word costs a player one
row of a guess they typed by mistake; **rejecting a real one ends the game in an
argument with the dictionary.** There is a regression test naming the specific
forms that must stay legal. The system dictionary at `/usr/share/dict/words` is
Webster's Second and stops around 1934: it is a lemma list with no "cakes", no
"boxes", and no "email". Rejecting a word a player knows is the one failure a
word game cannot afford, so `scripts/build-words.mjs` derives the missing
inflections from the shorter entries and layers on `extras.js` for everything
Webster never heard of. Over-accepting an obscure word is a shrug; rejecting a
common one ends the game.

```bash
npm run words   # after editing answers.js or extras.js
```

## ConnectNUB

36 hand-built boards in `src/connections/puzzles.js`, each four groups of four,
`level` 0–3 running yellow → purple, easiest → trickiest.

### The difficulty ladder

Solved rows stack in **the order you solved them**, not in colour order — get
purple first and the purple band sits at the top. Statistics track completions,
win rate, streaks, perfect puzzles and a mistake distribution from 0 to 4.

`categoryKind()` reads what *kind* a category is, and the ladder is enforced by
tests rather than trusted:

| | what it is | example |
| --- | --- | --- |
| **yellow** | the easiest — synonyms, direct relationships | CALM, TOOLS |
| **green** | clear, a little less obvious | THINGS YOU CAN CATCH |
| **blue** | slang, niche knowledge, narrow sub-categories | CRICKET TERMS, BRITISH SLANG |
| **purple** | **never** a plain list — wordplay, homophones, lateral blanks | FRUIT WITH ONE LETTER CHANGED |

Across the 48 boards: 138 plain categories, 24 fill-in-the-blank, 30 wordplay,
over **25 distinct mechanics** — anagrams, hidden words, homophones, rhymes,
palindromes, silent letters, words read backwards, letters added, first or last
letters dropped, Roman numerals, top-row typing, other languages. Every board
mixes at least two kinds, and at least 65% of the non-category groups sit at
purple where the scale puts them.

Most names give themselves away: a `___` is a blank, "ANAGRAMS OF" is wordplay.
Some do not — EMOTICON EYES is four punctuation marks standing in for a face,
which is as lateral as it gets and reads like a plain category. Those groups
carry an explicit `kind:` and it wins.

### Tiles are not always words

Three shapes of content share the grid, and `sizeClass()` sets each one:

- **Symbols.** A single character — `$`, `→`, `:` — is a word doing a word's
  job and is set *large*, in a sans stack, because the display serif has holes
  in it at those code points.
- **Phrases.** `TAPE MEASURE` has a space to break at, so it may wrap to two
  lines and stay readable.
- **Long single words.** These may *not* wrap — breaking `WHEELBARROW` across
  two lines is worse than setting it small — so they shrink instead.

Every board is written to one rule: **the hard part is never the vocabulary, it
is that words belong to categories they are not in.** NAVY sits under shades of
blue while the beans are elsewhere; SPELL is a stretch of work, not magic. A
board where each word only ever fits one group is a word list, not a puzzle.

`puzzles.js` validates itself at import — a repeated word, a missing colour or a
group of five fails the build rather than surfacing on the day it comes up.

A solved row slides up to join the others rather than snapping there. Grid
reflow is instant and free, which reads as a glitch, so `Connections.jsx`
measures the tiles before the reorder, transforms them back to where they were,
and releases them for the browser to animate.

## Adding a fourth game

1. Build it under `src/<game>/`.
2. Add it to `ROUTES` in `src/main.jsx`.
3. Add a card to `GAMES` in `src/games.js`, with an `art` key pointing at a
   preview component in `src/hub/Hub.jsx`.

Each game screen keeps its own look — the hub is what makes them a set.

## Tests

```bash
npm test
```

35 assertions across scoring, hard mode, share grids, the Belgian day counter
(both clock changes included) and every puzzle board. No test runner, no watch
mode: it exits 0 or tells you what broke.

Run it from somewhere else to prove the day boundary does not depend on the
machine:

```bash
TZ=Pacific/Kiritimati npm test
```

## Deploying

`netlify.toml` builds on Netlify — there are no secrets at build time, so unlike
RummiNUB this one does not need a local build and upload.

`public/_redirects` is load-bearing. Without it a cold load of `/wordle` makes
the host look for a file at that path and 404.
