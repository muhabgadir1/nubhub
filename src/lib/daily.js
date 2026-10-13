/**
 * Which puzzle is today's, and how long until the next one.
 *
 * The day turns over at **midnight in Belgium**, not in whatever timezone the
 * player happens to be sitting in. That is the whole point: everyone gets the
 * same puzzle at the same moment, and someone waking up in Brussels finds a new
 * word waiting rather than yesterday's. A player in California sees the puzzle
 * roll at 3 or 4pm their time, which is why both end screens say so out loud —
 * a countdown that ends in the middle of the afternoon looks broken otherwise.
 *
 * Nothing here hardcodes an offset. Belgium is UTC+1 in winter and UTC+2 in
 * summer, so a fixed +1 would hand out the wrong puzzle for half the year and
 * a fixed +2 for the other half. The zone is resolved through `Intl` instead,
 * which knows the rules and keeps knowing them when they change.
 */

const ZONE = "Europe/Brussels";
const DAY_MS = 24 * 60 * 60 * 1000;

/** Day zero, as a Belgian calendar date. Puzzle 1 is the day after this. */
const EPOCH = Date.UTC(2026, 7, 29); // 29 Aug 2026. Months are 0-based.

const parts = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONE,
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit",
  hour12: false,
});

/**
 * The wall clock in Brussels at some instant, as plain numbers.
 *
 * Read from `formatToParts` rather than by parsing a formatted string, because
 * the order and punctuation of a formatted date are a locale's business and
 * change without warning.
 */
function brussels(instant) {
  const out = {};
  for (const { type, value } of parts.formatToParts(instant)) {
    if (type !== "literal") out[type] = Number(value);
  }
  // Midnight comes back as hour 24 in some engines and 0 in others.
  if (out.hour === 24) out.hour = 0;
  return out;
}

/** Brussels' offset from UTC at a given instant, in milliseconds. */
function offsetAt(instant) {
  const b = brussels(instant);
  // Reading the Brussels wall clock *as if* it were UTC and subtracting the
  // real instant leaves exactly the offset — +1h in winter, +2h in summer.
  const asIfUTC = Date.UTC(b.year, b.month - 1, b.day, b.hour, b.minute, b.second);
  return asIfUTC - instant.getTime() + (instant.getTime() % 1000);
}

/** The instant at which a given Belgian calendar date begins. */
function startOfBelgianDay(year, month, day) {
  const naive = Date.UTC(year, month - 1, day);
  // First guess uses the offset in force *around* that date; if the guess lands
  // on the far side of a clock change, the second pass corrects it. Belgium
  // changes its clocks at 02:00/03:00, never at midnight, so the midnight this
  // resolves to always exists and is never ambiguous.
  const guess = naive - offsetAt(new Date(naive));
  const settled = naive - offsetAt(new Date(guess));
  return settled;
}

/**
 * 1 on the first day, 2 on the second, and so on — counted in Belgian days.
 *
 * Both sides of the subtraction are UTC midnights standing in for calendar
 * dates, so the difference is an exact number of days no matter how many hours
 * the real Belgian day happened to have.
 */
export function dayNumber(now = new Date()) {
  const b = brussels(now);
  return Math.round((Date.UTC(b.year, b.month - 1, b.day) - EPOCH) / DAY_MS);
}

/** The entry for today from a list that wraps once it runs out. */
export function pickForToday(list, now = new Date()) {
  const n = dayNumber(now);
  return list[((n - 1) % list.length + list.length) % list.length];
}

/** Milliseconds until the next midnight in Belgium. */
export function msUntilTomorrow(now = new Date()) {
  const b = brussels(now);
  return startOfBelgianDay(b.year, b.month, b.day + 1) - now.getTime();
}

/** "07:42:15" — the countdown on the end screens. */
export function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/**
 * Whether the player is somewhere that agrees with Belgium about what day it
 * is. When they are not, the end screens explain why the countdown ends in the
 * afternoon instead of at their own midnight.
 */
export function inBelgianTime() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone === ZONE;
  } catch {
    return false;
  }
}

/** "midnight in Belgium" as a local wall-clock time, e.g. "3:00 PM". */
export function rolloverLocalTime(now = new Date()) {
  const next = new Date(now.getTime() + msUntilTomorrow(now));
  return next.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
