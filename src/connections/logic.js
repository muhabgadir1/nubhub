/**
 * Connections rules. Pure functions — no React, no DOM.
 */

export const MAX_MISTAKES = 4;

/** Level 0 is the gentlest category, 3 the one with the trick in it. */
export const LEVEL_EMOJI = ["🟨", "🟩", "🟦", "🟪"];

/**
 * A deterministic shuffle, so the board looks the same when you come back to
 * it mid-game instead of rearranging itself behind your back. The Shuffle
 * button passes a random seed; the initial layout passes the puzzle number.
 */
export function seededShuffle(items, seed) {
  const out = [...items];
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Judge four selected words.
 *
 * `away` is how many of the four belong to whichever group they most nearly
 * make — 3 is the "one away" near miss the game calls out, and telling the
 * player about it is most of what makes a wrong guess feel fair rather than
 * arbitrary.
 */
export function judge(selection, groups) {
  let best = 0;
  for (const group of groups) {
    const hits = selection.filter((w) => group.words.includes(w)).length;
    if (hits === 4) return { group, away: 0 };
    best = Math.max(best, hits);
  }
  return { group: null, away: 4 - best };
}

/** Which group each word belongs to — used to colour the share grid. */
export function levelOf(word, groups) {
  return groups.find((g) => g.words.includes(word))?.level ?? 0;
}

/** Have these four words been tried already, in any order? */
export function alreadyGuessed(selection, history) {
  const key = [...selection].sort().join("|");
  return history.some((g) => [...g].sort().join("|") === key);
}

/**
 * What *kind* of puzzle a category is, read from its name.
 *
 * The three kinds are the difficulty ladder, not decoration:
 *
 *   category — a plain semantic set. SPICES. BREEDS OF CAT.
 *   blank    — a compound with a hole in it. "___ STORM".
 *   wordplay — the answer is in the letters, not the meaning: an anagram, a
 *              hidden word, a homophone, a letter dropped from the front.
 *
 * Derived from the name rather than stored on each group, so a category can
 * never claim to be one kind while being written as another.
 */
const WORDPLAY = new RegExp([
  "SOUND LIKE", "HOMOPHONE", "RHYME", "HIDDEN", "INSIDE", "PALINDROME",
  "BACKWARD", "ANAGRAM", "DROP THE", "REMOVE THE", "ADD AN?\\b", "PLUS A LETTER",
  "LETTER CHANGED", "SILENT", "FIRST LETTER", "LAST LETTER", "SPELLED WITH",
  "TYPED ON", "SAME SINGULAR", "COUNTERPARTS", "ONLY MUSICAL", "ROMAN NUMERAL",
  "OTHER LANGUAGES", "WITHOUT THE",
].join("|"), "i");

/**
 * @param {string} name
 * @param {"category"|"blank"|"wordplay"} [explicit] set on the group itself
 *
 * Most names give themselves away — a "___" means a blank, "ANAGRAMS OF" means
 * wordplay. Some do not: EMOTICON EYES is four punctuation marks standing in
 * for a face, which is as lateral as it gets and reads like a plain category.
 * Those groups carry an explicit `kind`, and it wins. Everything else is
 * derived, so a category cannot claim one thing while being written as another.
 */
export function categoryKind(name, explicit) {
  if (explicit) return explicit;
  if (name.includes("___")) return "blank";
  if (WORDPLAY.test(name)) return "wordplay";
  return "category";
}

const TITLES = ["Perfect!", "Great!", "Solid!", "Phew!"];

export function resultTitle(mistakes, won) {
  return won ? TITLES[mistakes] ?? "Phew!" : "Next Time";
}

/**
 * The share grid: one row per guess, in the order they were made, each square
 * coloured by which group that word actually belonged to. A row of four
 * matching squares is a solve; a mixed row is a mistake, and the pattern of
 * near-misses is the whole reason people paste these at each other.
 */
export function shareText({ dayNumber, history, groups }) {
  const grid = history
    .map((guess) => guess.map((w) => LEVEL_EMOJI[levelOf(w, groups)]).join(""))
    .join("\n");
  return `NUBHUB ConnectNUB\nPuzzle #${dayNumber}\n${grid}`;
}
