import { test, eq, ok, done } from "./harness.mjs";
import {
  normalize, isCorrect, verdict, resultTitle, shareText,
  LEVELS, RUNGS, ATTEMPTS, STREAK_TARGET,
} from "../src/math/logic.js";
import { questionFor, ladderFor } from "../src/math/generate.js";

console.log("math");

test("the same day gives everyone the same ladder", () => {
  eq(ladderFor(42).map((q) => q.prompt), ladderFor(42).map((q) => q.prompt));
  ok(ladderFor(42)[0].prompt !== ladderFor(43)[0].prompt, "consecutive days differ");
  // Two rungs on one day must be independent, not the same seed shifted.
  ok(questionFor(42, 0).prompt !== questionFor(42, 1).prompt);
});

test("a value can be written the many ways people write it", () => {
  const same = (a, b) => eq(normalize(a), normalize(b), `${a} vs ${b}`);
  same("x = 6", "6");
  same("+6", "6");
  same("6.0", "6");
  same("12x³", "12x^3");
  same("12x**3", "12x^3");
  same("12 x ^ 3", "12x^3");
  same("49π", "49pi");
  same("−7", "-7");        // unicode minus
  same("√16", "sqrt16");
  same(" 3/4 ", "3/4");
});

test("a normalizer that ate the answer would be worse than none", () => {
  // The leading-variable strip must not swallow a bare "=" or an empty answer.
  eq(normalize("="), "=");
  eq(normalize(""), "");
  eq(normalize("0"), "0");
  ok(!isCorrect("", { answer: "6" }), "blank is never right");
});

test("two roots count in either order, but one root is not two", () => {
  const q = { answer: "2, 3" };
  ok(isCorrect("2, 3", q));
  ok(isCorrect("3, 2", q));
  ok(isCorrect("3 and 2", q));
  ok(!isCorrect("2", q), "half an answer is not the answer");
  ok(!isCorrect("2, 4", q));
});

/* The generators are the part that could be quietly, permanently wrong: a bad
   answer would not surface until the day it came up, and the player would have
   no way to tell it was the game and not them. So every rung of a few hundred
   days is checked. */

test("every generated question accepts its own answer", () => {
  const bad = [];
  for (let day = 1; day <= 400; day++) {
    for (let rung = 0; rung < RUNGS; rung++) {
      const q = questionFor(day, rung);
      if (!isCorrect(q.answer, q)) bad.push(`day ${day} ${LEVELS[rung].name}: "${q.answer}"`);
      for (const alt of q.alts) {
        if (!isCorrect(alt, q)) bad.push(`day ${day} ${LEVELS[rung].name}: alt "${alt}"`);
      }
    }
  }
  eq(bad.slice(0, 5), [], `${bad.length} questions reject their own answer`);
});

test("no question is malformed, empty or absurdly long", () => {
  const bad = [];
  for (let day = 1; day <= 400; day++) {
    for (let rung = 0; rung < RUNGS; rung++) {
      const q = questionFor(day, rung);
      if (!q.prompt || !q.prompt.trim()) bad.push(`day ${day} rung ${rung}: no prompt`);
      if (q.answer === undefined || q.answer === null || q.answer === "") {
        bad.push(`day ${day} rung ${rung}: no answer`);
      }
      if (q.prompt.length > 110) bad.push(`day ${day} rung ${rung}: prompt ${q.prompt.length} chars`);
      // "x¹" and "1x" are things a generator does and a person never writes.
      if (/x¹/.test(q.prompt) || /x¹/.test(String(q.answer))) bad.push(`day ${day} rung ${rung}: x¹`);
      if (/\b1x/.test(String(q.answer))) bad.push(`day ${day} rung ${rung}: 1x`);
      if (/NaN|undefined|Infinity/.test(q.prompt + q.answer)) bad.push(`day ${day} rung ${rung}: junk`);
    }
  }
  eq(bad.slice(0, 5), [], `${bad.length} malformed questions`);
});

test("the arithmetic itself is right, checked independently of the generator", () => {
  // Recompute a sample of prompts from scratch. A generator that got the sum
  // wrong would still accept its own answer, so agreement is not enough.
  const bad = [];
  for (let day = 1; day <= 300; day++) {
    for (const rung of [0, 1, 5, 7, 11]) {
      const q = questionFor(day, rung);
      let plain = null;

      let m = /^(\d+) \+ (\d+)$/.exec(q.prompt);
      if (m) plain = +m[1] + +m[2];
      m = /^(\d+) − (\d+)$/.exec(q.prompt);
      if (m) plain = +m[1] - +m[2];
      m = /^(\d+) × (\d+)$/.exec(q.prompt);
      if (m) plain = +m[1] * +m[2];
      m = /^(\d+) ÷ (\d+)$/.exec(q.prompt);
      if (m) plain = +m[1] / +m[2];
      // ax + b = c  →  x = (c − b)/a
      m = /^Solve for x:\s+(\d+)x ([+−]) (\d+) = (-?\d+)$/.exec(q.prompt);
      if (m) plain = (+m[4] - (m[2] === "+" ? +m[3] : -+m[3])) / +m[1];
      // x² − Sx + P = 0 — the roots must actually satisfy it.
      m = /^Solve:\s+x² − (\d+)x \+ (\d+) = 0$/.exec(q.prompt);
      if (m) {
        const [s, p] = [+m[1], +m[2]];
        for (const root of String(q.answer).split(",").map((x) => +x.trim())) {
          if (root * root - s * root + p !== 0) bad.push(`day ${day}: ${root} is not a root of ${q.prompt}`);
        }
      }
      // lim(x→a) (x² − a²)/(x − a) = 2a
      m = /^Evaluate:\s+lim（?\(x→(\d+)\)/.exec(q.prompt) || /lim\(x→(\d+)\)/.exec(q.prompt);
      if (m) plain = 2 * +m[1];

      if (plain !== null && String(plain) !== String(q.answer)) {
        bad.push(`day ${day} rung ${rung}: "${q.prompt}" says ${q.answer}, should be ${plain}`);
      }
    }
  }
  eq(bad.slice(0, 5), [], `${bad.length} wrong answers`);
});

test("fractions come back in lowest terms", () => {
  const bad = [];
  for (let day = 1; day <= 300; day++) {
    const q = questionFor(day, 3);
    const m = /^(\d+)\/(\d+)$/.exec(String(q.answer));
    if (!m) continue;
    const g = (a, b) => (b ? g(b, a % b) : a);
    if (g(+m[1], +m[2]) !== 1) bad.push(`day ${day}: ${q.answer} is not reduced`);
  }
  eq(bad.slice(0, 5), [], `${bad.length} unreduced fractions`);
});

test("the ladder is twelve rungs, three tries each", () => {
  eq(RUNGS, 12);
  eq(LEVELS.length, 12);
  eq(ATTEMPTS, 3);
  eq(LEVELS[0].name, "Grade 2");
  eq(LEVELS[RUNGS - 1].name, "College");
  eq(new Set(LEVELS.map((l) => l.name)).size, RUNGS, "duplicate level names");
});

test("the share grid shows where the run stopped", () => {
  const text = shareText({ dayNumber: 5, cleared: 3, attemptsUsed: [1, 2, 3] });
  ok(text.startsWith("NUBHUB MathNUB 5\n3/12 rungs"), text);
  ok(text.includes("🟩"), "a first-try rung");
  ok(text.includes("🟨"), "a second-try rung");
  ok(text.includes("🟧"), "a third-try rung");
  ok(text.includes("🟥"), "the rung it stopped on");
  const perfect = shareText({ dayNumber: 5, cleared: 12, attemptsUsed: Array(12).fill(1) });
  ok(!perfect.includes("🟥"), "a full climb has no red");
});

test("the verdict and title track how far up you got", () => {
  eq(resultTitle(12), "Perfect climb!");
  ok(resultTitle(STREAK_TARGET).length > 0);
  eq(resultTitle(0), "Next time");
  eq(verdict(12), "All the way up.");
  ok(verdict(STREAK_TARGET).includes("streak"), "clearing the target says so");
  ok(!verdict(STREAK_TARGET - 1).includes("streak"));
});

done("math");
