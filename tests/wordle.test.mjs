import { test, eq, ok, done } from "./harness.mjs";
import {
  scoreGuess, keyboardState, hardModeViolation, shareText,
  CORRECT, PRESENT, ABSENT,
} from "../src/wordle/logic.js";
import { loadDictionary } from "../src/wordle/dictionary.js";
import { ANSWERS, LENGTHS } from "../src/wordle/answers.js";

// Loaded up front so the assertions below can stay synchronous.
const DICTS = Object.fromEntries(
  await Promise.all(LENGTHS.map(async (n) => [n, await loadDictionary(n)])),
);
const isWord = (w) => DICTS[w.length]?.has(w) ?? false;
import { dayNumber, pickForToday, msUntilTomorrow, formatCountdown } from "../src/lib/daily.js";

console.log("wordle");

const C = CORRECT, P = PRESENT, A = ABSENT;

test("all greens on an exact match", () => {
  eq(scoreGuess("crane", "crane"), [C, C, C, C, C]);
});

test("a letter that is not there at all is grey", () => {
  eq(scoreGuess("bloom", "crane"), [A, A, A, A, A]);
});

test("right letter, wrong place is yellow", () => {
  eq(scoreGuess("cared", "crane"), [C, P, P, P, A]);
});

// The repeated-letter cases are the ones a naive single pass gets wrong, and
// they are the only place the two-pass structure of scoreGuess earns itself.
test("a second copy goes grey when the answer holds only one", () => {
  // SPEED against ABIDE: one E in the answer. The first E takes it; the second
  // gets nothing, because there is no second E to be misplaced.
  eq(scoreGuess("speed", "abide"), [A, A, P, A, P]);
});

test("greens are claimed before yellows", () => {
  // EERIE against BADGE: the only E in the answer is the one already sitting
  // green at the end. Score left to right in one pass and the leading E turns
  // yellow, telling the player about an E that does not exist.
  eq(scoreGuess("eerie", "badge"), [A, A, A, A, C]);
});

test("a doubled answer letter can pay out twice", () => {
  // NERVE against SHEEP: two Es in the answer, two in the guess, neither in
  // place — so both are yellow.
  eq(scoreGuess("nerve", "sheep"), [A, P, A, A, P]);
});

test("keyboard keeps the best result for a letter, never a worse one", () => {
  // E is green in the first guess and misplaced in the second; it must stay green.
  eq(keyboardState(["sheep", "nerve"], "sheep").e, CORRECT);
  // And a letter ruled out stays ruled out.
  eq(keyboardState(["crane"], "sheep").c, ABSENT);
});

test("keyboard is empty before anything is guessed", () => {
  eq(keyboardState([], "crane"), {});
});

test("hard mode holds a green letter in place", () => {
  // CRANE against CRANK: C R A N all green. The next guess must keep them.
  eq(hardModeViolation("bloom", "crane", "crank"), "C must be in the 1st position");
});

test("hard mode requires a yellow letter to reappear", () => {
  // CARED against CRANE returns R, A and E yellow; dropping them is refused.
  ok(hardModeViolation("blips", "cared", "crane"), "should be refused");
  eq(hardModeViolation("crane", "cared", "crane"), null, "reusing them is fine");
});

test("hard mode counts repeated yellows", () => {
  // Two Es shown as present must both come back.
  const msg = hardModeViolation("sheet", "eerie", "sheep");
  eq(msg, null, "SHEET keeps both Es");
});

test("hard mode allows anything on the first guess", () => {
  eq(hardModeViolation("crane", undefined, "bloom"), null);
});

test("share grid matches the board, and marks a loss with X", () => {
  const text = shareText({
    dayNumber: 4, guesses: ["cared", "crane"], answer: "crane", won: true,
    hardMode: false, darkTheme: false, highContrast: false,
  });
  eq(text, "NUBHUB WordNUB 4 2/6\n\n🟩🟨🟨🟨⬜\n🟩🟩🟩🟩🟩");

  const lost = shareText({
    dayNumber: 9, guesses: ["bloom"], answer: "crane", won: false,
    hardMode: true, darkTheme: true, highContrast: false,
  });
  ok(lost.startsWith("NUBHUB WordNUB 9 X/6*"), "loss is X/6, hard mode adds a star");
  ok(lost.includes("⬛"), "dark theme uses the dark square");
});

test("high contrast changes the share squares too", () => {
  const text = shareText({
    dayNumber: 1, guesses: ["crane"], answer: "crane", won: true,
    hardMode: false, darkTheme: false, highContrast: true,
  });
  ok(text.includes("🟧"), "orange, not green");
});

test("every answer at every length is a legal guess", () => {
  for (const n of LENGTHS) {
    const bad = ANSWERS[n].filter((w) => !isWord(w));
    eq(bad, [], `length ${n}: answers missing from their dictionary`);
  }
});

test("every length has enough words to keep going for months", () => {
  for (const n of LENGTHS) {
    ok(ANSWERS[n].length >= 300, `length ${n} only has ${ANSWERS[n].length} answers`);
    ok(DICTS[n].size > ANSWERS[n].length * 5, `length ${n} guess list is too thin`);
  }
});

test("no answer list contains a word of the wrong length", () => {
  for (const n of LENGTHS) {
    const wrong = ANSWERS[n].filter((w) => w.length !== n);
    eq(wrong, [], `length ${n} has misfiled words`);
  }
});

test("inflections webster never listed are still legal guesses", () => {
  /* Webster's is a lemma list with inconsistent inflections: it carries
     "embezzle" and "embezzler" and no "embezzling", and it has no y-to-ies
     plurals at all. Every one of these is a word a player would reasonably
     type, and being told otherwise is the one failure this game cannot afford. */
  const forms = [
    "embezzling",  // silent e dropped before -ing, and absent from Webster
    "panicking",   // c takes a k before -ing
    "mimicking", "picnicking",   // ("trafficking" is 11 — past what the game plays)
    "cities", "stories", "families", "berries", "puppies",  // y becomes ies
    "carried", "happiest", "happily", "happiness",          // y becomes i
    "stopping", "beginning", "referring",                   // doubled consonant
    "studying", "squeezing", "building", "travelled",
    "darkness", "quickly", "bigger",
  ];
  // Guard the guard: a typo that put an out-of-range word in this list would
  // otherwise quietly pass, since no dictionary holds one.
  const outOfRange = forms.filter((w) => w.length < 5 || w.length > 10);
  eq(outOfRange, [], "probe words must be playable lengths");
  const missing = forms.filter((w) => !isWord(w));
  eq(missing, [], "real words rejected by the dictionary");
});

test("the long dictionaries know ordinary long words", () => {
  for (const w of ["garden", "kitchen", "birthday", "wonderful", "everything",
                   "planet", "morning", "computer", "beautiful", "understand"]) {
    ok(isWord(w), `${w} should be a legal guess`);
  }
});

test("scoring and hard mode work at every length, not just five", () => {
  // Ten letters, one repeated pair, nothing in place.
  eq(scoreGuess("understand", "understand").every((x) => x === CORRECT), true);
  const score = scoreGuess("wonderland", "understand");
  eq(score.length, 10, "a ten-letter guess scores ten tiles");
  // The ordinal in a hard-mode message has to survive past "5th".
  const msg = hardModeViolation("wonderland", "understand", "understand");
  ok(msg && /10th|1st|2nd|3rd|[4-9]th/.test(msg), `unexpected message: ${msg}`);
});

test("a Long Words share says which length it was", () => {
  const five = shareText({
    dayNumber: 3, guesses: ["crane"], answer: "crane", won: true,
    hardMode: false, darkTheme: true, highContrast: false,
  });
  ok(five.startsWith("NUBHUB WordNUB 3 "), five);
  const ten = shareText({
    dayNumber: 3, guesses: ["understand"], answer: "understand", won: true,
    hardMode: false, darkTheme: true, highContrast: false,
  });
  ok(ten.startsWith("NUBHUB WordNUB 10 3 "), ten);
});

test("the five-letter dictionary knows plurals and modern words", () => {
  for (const w of ["cakes", "boxes", "games", "email", "vibes", "texts", "pizza", "tacos"]) {
    ok(isWord(w), `${w} should be a legal guess`);
  }
  ok(!isWord("zzzzz"), "nonsense is refused");
});

/* The day boundary is midnight in Belgium, so every case here is written as a
   UTC instant. Writing them as local dates would make the suite pass or fail
   depending on which machine ran it. */

test("the puzzle turns over at Belgian midnight in summer", () => {
  // Brussels is UTC+2 in August, so its midnight is 22:00 UTC the day before.
  eq(dayNumber(new Date("2026-08-29T21:59:59Z")), 0, "still the day before");
  eq(dayNumber(new Date("2026-08-29T22:00:00Z")), 1, "puzzle 1 begins");
  eq(dayNumber(new Date("2026-08-30T21:59:59Z")), 1);
  eq(dayNumber(new Date("2026-08-30T22:00:00Z")), 2);
});

test("the puzzle turns over at Belgian midnight in winter", () => {
  // Brussels is UTC+1 in December — an hour later in UTC terms, same midnight
  // locally. A hardcoded offset would be wrong for one of these two tests.
  const before = dayNumber(new Date("2026-12-24T22:59:59Z"));
  eq(dayNumber(new Date("2026-12-24T23:00:00Z")), before + 1, "rolls at 23:00 UTC, not 22:00");
});

test("a day is still one day across both Belgian clock changes", () => {
  // Clocks go back on 25 Oct 2026, making that Belgian day 25 hours long.
  const octBefore = dayNumber(new Date("2026-10-24T23:00:00Z"));
  const octAfter = dayNumber(new Date("2026-10-25T23:00:00Z"));
  eq(octAfter - octBefore, 1, "a 25-hour day is one day");
  // And forward on 29 Mar 2027, making that one 23 hours long.
  const marBefore = dayNumber(new Date("2027-03-28T12:00:00Z"));
  const marAfter = dayNumber(new Date("2027-03-29T12:00:00Z"));
  eq(marAfter - marBefore, 1, "a 23-hour day is one day");
});

test("the countdown lands exactly on the next Belgian midnight", () => {
  for (const iso of [
    "2026-08-30T10:00:00Z",   // ordinary summer day
    "2026-12-24T10:00:00Z",   // ordinary winter day
    "2026-10-25T10:00:00Z",   // the 25-hour day
    "2027-03-29T10:00:00Z",   // the 23-hour day
    "2026-08-29T22:00:01Z",   // one second after a rollover
  ]) {
    const now = new Date(iso);
    const left = msUntilTomorrow(now);
    ok(left > 0, `${iso}: countdown must be positive`);
    ok(left <= 26 * 3600 * 1000, `${iso}: countdown must be under a long day`);
    const landing = new Date(now.getTime() + left);
    eq(dayNumber(landing), dayNumber(now) + 1, `${iso}: landing on the next puzzle`);
    // And a moment earlier is still today, so it is the boundary and not past it.
    eq(dayNumber(new Date(landing.getTime() - 1000)), dayNumber(now), `${iso}: not overshooting`);
  }
});

test("everyone everywhere gets the same puzzle at the same instant", () => {
  // dayNumber reads an absolute instant, so two players cannot disagree.
  const instant = new Date("2026-08-30T23:30:00Z");
  eq(dayNumber(instant), 2, "22:00 UTC has passed, so it is puzzle 2 worldwide");
});

test("the puzzle list wraps rather than running out", () => {
  eq(pickForToday(["a", "b"], new Date("2026-08-30T10:00:00Z")), "a");
  eq(pickForToday(["a", "b"], new Date("2026-08-31T10:00:00Z")), "b");
  eq(pickForToday(["a", "b"], new Date("2026-09-01T10:00:00Z")), "a", "day 3 comes back around");
});

test("countdown is zero-padded", () => {
  eq(formatCountdown(3661000), "01:01:01");
  eq(formatCountdown(0), "00:00:00");
  eq(formatCountdown(-5), "00:00:00", "never counts below zero");
});

done("wordle");
