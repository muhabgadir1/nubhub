/**
 * The guess dictionaries, one per word length.
 *
 * Five letters is bundled, because that is the game almost everyone opens and
 * a network round trip before the first guess would be felt. Six through ten
 * are dynamic imports, so a player who never turns on Long Words never
 * downloads the ~1MB those lengths add — Vite gives each its own chunk.
 *
 * Sets are cached after the first load: switching lengths back and forth costs
 * one fetch each, not one per switch.
 */
import { PACKED as PACKED_5 } from "./dict-5.js";

/** Split a packed run of fixed-width words back into a Set. */
function unpack(packed, length) {
  const set = new Set();
  for (let i = 0; i < packed.length; i += length) set.add(packed.slice(i, i + length));
  return set;
}

const cache = new Map([[5, unpack(PACKED_5, 5)]]);

// Written out rather than built from a template string so the bundler can see
// each import and split it into its own chunk.
const LAZY = {
  6: () => import("./dict-6.js"),
  7: () => import("./dict-7.js"),
  8: () => import("./dict-8.js"),
  9: () => import("./dict-9.js"),
  10: () => import("./dict-10.js"),
};

/** The word list for one length. Resolves immediately for five letters. */
export async function loadDictionary(length) {
  const held = cache.get(length);
  if (held) return held;
  const loader = LAZY[length];
  if (!loader) throw new Error(`no dictionary for length ${length}`);
  const { PACKED } = await loader();
  const set = unpack(PACKED, length);
  cache.set(length, set);
  return set;
}

/** Whether a length is already in memory — used to skip a loading state. */
export function isLoaded(length) {
  return cache.has(length);
}
