/**
 * Wordle scoring. Pure functions, no React, no DOM — this is the part with the
 * subtle bugs, so it is the part that is testable in isolation.
 */

/** The classic game. Long Words mode runs 6 through 10. */
export const DEFAULT_LENGTH = 5;
export const MIN_LENGTH = 5;
export const MAX_LENGTH = 10;

/**
 * Six rows at every length.
 *
 * A ten-letter word is not five times harder than a five-letter one — each
 * guess also reveals twice as many letters — so the row count stays put. It
 * also keeps a distribution chart, a share grid and a streak meaning the same
 * thing whichever length you play.
 */
export const MAX_GUESSES = 6;

/** The three states a letter can be in once a row is scored. */
export const CORRECT = "correct"; // right letter, right place
export const PRESENT = "present"; // right letter, wrong place
export const ABSENT = "absent";   // not in the word (or not *another* one)

/**
 * Score one guess against the answer.
 *
 * The whole difficulty is repeated letters, and it is why this is two passes
 * rather than one. Greens are claimed first, each one consuming a letter from
 * a pool of what the answer actually contains; only then do the leftovers
 * compete for yellows. Score left-to-right in a single pass instead and
 * guessing SPEED against ERASE paints the first E yellow even though that E is
 * already spoken for by the green one later in the row — the board then tells
 * you there are two Es when there is one.
 *
 * @param {string} guess  five lowercase letters
 * @param {string} answer five lowercase letters
 * @returns {string[]} one of CORRECT/PRESENT/ABSENT per position
 */
export function scoreGuess(guess, answer) {
  const length = answer.length;
  const result = new Array(length).fill(ABSENT);
  const pool = new Map();

  // Pass one: greens, and bank everything they did not use.
  for (let i = 0; i < length; i++) {
    if (guess[i] === answer[i]) {
      result[i] = CORRECT;
    } else {
      pool.set(answer[i], (pool.get(answer[i]) || 0) + 1);
    }
  }

  // Pass two: yellows, first come first served, only while the pool holds out.
  for (let i = 0; i < length; i++) {
    if (result[i] === CORRECT) continue;
    const left = pool.get(guess[i]) || 0;
    if (left > 0) {
      result[i] = PRESENT;
      pool.set(guess[i], left - 1);
    }
  }

  return result;
}

const RANK = { [ABSENT]: 0, [PRESENT]: 1, [CORRECT]: 2 };

/**
 * What colour each key on the keyboard should be, given every guess so far.
 *
 * A key only ever gets better. Once you have seen a green E, a later guess
 * that puts E somewhere wrong must not repaint that key yellow — the keyboard
 * is a record of the best you have learned about a letter, not of your last
 * attempt at it.
 */
export function keyboardState(guesses, answer) {
  const best = {};
  for (const guess of guesses) {
    const score = scoreGuess(guess, answer);
    for (let i = 0; i < answer.length; i++) {
      const ch = guess[i];
      if (best[ch] === undefined || RANK[score[i]] > RANK[best[ch]]) {
        best[ch] = score[i];
      }
    }
  }
  return best;
}

/** "1st" … "10th", for naming the position a locked-in letter belongs to. */
function ordinal(i) {
  const n = i + 1;
  const tail = n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
  return `${n}${tail}`;
}

/**
 * Hard mode: every hint you have been given must be used in the next guess.
 *
 * Returns null when the guess is allowed, or the message to toast when it is
 * not. Greens are checked before yellows because "must use E in the 3rd
 * position" is a more useful complaint than "guess must contain E" when both
 * are true.
 */
export function hardModeViolation(guess, previousGuess, answer) {
  if (!previousGuess) return null;
  const score = scoreGuess(previousGuess, answer);

  for (let i = 0; i < answer.length; i++) {
    if (score[i] === CORRECT && guess[i] !== previousGuess[i]) {
      return `${previousGuess[i].toUpperCase()} must be in the ${ordinal(i)} position`;
    }
  }

  // A yellow letter must reappear somewhere — and if two of them came back
  // yellow, the next guess needs two of them, which counting handles and a
  // plain `includes` would not.
  const need = new Map();
  for (let i = 0; i < answer.length; i++) {
    if (score[i] === PRESENT) need.set(previousGuess[i], (need.get(previousGuess[i]) || 0) + 1);
  }
  const have = new Map();
  for (const ch of guess) have.set(ch, (have.get(ch) || 0) + 1);
  for (const [ch, count] of need) {
    if ((have.get(ch) || 0) < count) {
      return `Guess must contain ${ch.toUpperCase()}`;
    }
  }

  return null;
}

/** The line of praise shown when you win, indexed by how many rows it took. */
const PRAISE = ["Genius", "Magnificent", "Impressive", "Splendid", "Great", "Phew"];

export function praiseFor(guessCount) {
  return PRAISE[guessCount - 1] || PRAISE[PRAISE.length - 1];
}

/**
 * The emoji grid people paste into group chats.
 *
 * High-contrast mode swaps the squares as well as the board, because the whole
 * point of that setting is that the person using it cannot tell green from
 * yellow — and a share they cannot read is a share that leaks their result to
 * everyone but them.
 */
export function shareText({ dayNumber, guesses, answer, won, hardMode, darkTheme, highContrast }) {
  // Long Words results say so, or a 4/6 at ten letters reads as an ordinary one.
  const label = answer.length === DEFAULT_LENGTH ? "WordNUB" : `WordNUB ${answer.length}`;
  const correct = highContrast ? "🟧" : "🟩";
  const present = highContrast ? "🟦" : "🟨";
  const absent = darkTheme ? "⬛" : "⬜";

  const grid = guesses
    .map((guess) =>
      scoreGuess(guess, answer)
        .map((s) => (s === CORRECT ? correct : s === PRESENT ? present : absent))
        .join(""),
    )
    .join("\n");

  const tally = won ? `${guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
  return `NUBHUB ${label} ${dayNumber} ${tally}${hardMode ? "*" : ""}\n\n${grid}`;
}
