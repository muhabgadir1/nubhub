/**
 * MathNUB rules: what counts as the right answer, and what a run is worth.
 *
 * Pure functions, no React — this is the part where being wrong is expensive,
 * because marking a correct answer wrong is the fastest way to make someone
 * stop playing.
 */

export const ATTEMPTS = 3;
/** Clear this many rungs and the streak survives. */
export const STREAK_TARGET = 9;

/**
 * Reduce an answer to the one spelling everything else is compared against.
 *
 * Players type the same value a dozen ways — "x = 6", "6", "+6", "12x³",
 * "12x^3", "3.14" for π. Rather than ask each generator to enumerate every
 * variation, everything is flattened here first: case, whitespace, the four
 * kinds of minus sign, superscripts, and a leading "x =" that restates the
 * question rather than answering it.
 */
export function normalize(input) {
  let s = String(input ?? "").toLowerCase().trim();

  // Unicode punctuation people paste in, or that our own symbol pad inserts.
  s = s
    .replace(/[−–—]/g, "-")   // minus, en dash, em dash
    .replace(/[×]/g, "*")
    .replace(/[÷]/g, "/")
    .replace(/√/g, "sqrt")
    .replace(/π/g, "pi")
    .replace(/\*\*/g, "^");

  // Superscript digits to caret form: 12x³ and 12x^3 are the same answer.
  const SUPER = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4",
                  "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };
  s = s.replace(/[⁰¹²³⁴-⁹]+/g, (run) =>
    "^" + [...run].map((c) => SUPER[c]).join(""));

  s = s.replace(/\s+/g, "");

  // "x=6" answers the question; so does "6". Drop a single leading variable,
  // but never a bare "=" that would leave nothing behind.
  s = s.replace(/^[a-z]=(?=.)/, "");
  // A leading plus is decoration, and 6.0 and 6 are the same number.
  s = s.replace(/^\+/, "");
  if (/^-?\d+\.\d*0+$/.test(s)) s = s.replace(/0+$/, "").replace(/\.$/, "");
  // "12*x^3" and "12x^3"; "2 * 3" is not an answer anyone types but be kind.
  s = s.replace(/\*/g, "");
  return s;
}

/**
 * Answers that are a set rather than a value — the two roots of a quadratic.
 *
 * Order is not part of the answer, so both sides are sorted before comparing;
 * "3, 2" and "2 and 3" are the same pair.
 */
function asSet(s) {
  const parts = s.split(/,|;|and/).filter(Boolean);
  if (parts.length < 2) return null;
  return parts.map(normalize).sort().join(",");
}

/** Does `input` answer this question? */
export function isCorrect(input, question) {
  const given = normalize(input);
  if (!given) return false;

  const accepted = [question.answer, ...(question.alts ?? [])];
  for (const a of accepted) {
    if (given === normalize(a)) return true;
    const set = asSet(String(a));
    if (set && asSet(String(input)) === set) return true;
  }
  return false;
}

/** Grade 2 through 12, then the last rung. */
export const LEVELS = [
  { key: 2,  label: "2",  name: "Grade 2",  topic: "Adding and taking away" },
  { key: 3,  label: "3",  name: "Grade 3",  topic: "Times tables" },
  { key: 4,  label: "4",  name: "Grade 4",  topic: "Long multiplication" },
  { key: 5,  label: "5",  name: "Grade 5",  topic: "Fractions and decimals" },
  { key: 6,  label: "6",  name: "Grade 6",  topic: "Percentages and ratio" },
  { key: 7,  label: "7",  name: "Grade 7",  topic: "Solving for x" },
  { key: 8,  label: "8",  name: "Grade 8",  topic: "Powers and roots" },
  { key: 9,  label: "9",  name: "Grade 9",  topic: "Quadratics" },
  { key: 10, label: "10", name: "Grade 10", topic: "Geometry" },
  { key: 11, label: "11", name: "Grade 11", topic: "Logs and sequences" },
  { key: 12, label: "12", name: "Grade 12", topic: "Trig and complex numbers" },
  { key: 13, label: "Σ", name: "College", topic: "Calculus" },
];

export const RUNGS = LEVELS.length;

/**
 * The line under the score.
 *
 * A run ends where you get stuck, so the score is how far up you climbed —
 * and the message names the rung rather than the number, because "you got to
 * calculus" means something and "11" does not.
 */
export function verdict(cleared) {
  if (cleared === RUNGS) return "All the way up.";
  if (cleared === 0) return "Everyone starts somewhere.";
  if (cleared >= STREAK_TARGET) return `Up to ${LEVELS[cleared].name}. That keeps the streak.`;
  return `Stopped at ${LEVELS[cleared].name}.`;
}

export function resultTitle(cleared) {
  if (cleared === RUNGS) return "Perfect climb!";
  if (cleared >= STREAK_TARGET) return "Strong run";
  if (cleared >= 5) return "Halfway up";
  if (cleared === 0) return "Next time";
  return "Made a start";
}

/**
 * The share grid: one square per rung, in order, so the shape of the run shows
 * where it ended without naming the questions.
 */
export function shareText({ dayNumber, cleared, attemptsUsed }) {
  const squares = LEVELS.map((_, i) => {
    if (i >= cleared) return i === cleared ? "\u{1f7e5}" : "⬛";
    const used = attemptsUsed[i] ?? 1;
    return used === 1 ? "\u{1f7e9}" : used === 2 ? "\u{1f7e8}" : "\u{1f7e7}";
  });
  const rows = [squares.slice(0, 6).join(""), squares.slice(6).join("")].join("\n");
  return `NUBHUB MathNUB ${dayNumber}\n${cleared}/${RUNGS} rungs\n\n${rows}`;
}
