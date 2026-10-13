/**
 * The twelve questions for a given day.
 *
 * Generated from the day number rather than written by hand: a hand-authored
 * set would need 12 questions every day forever, and the answers would drift
 * out of step with the prompts the first time one was edited. Generating them
 * means the answer is correct *by construction* — a quadratic is built from
 * the roots it is meant to have, a Pythagorean question from a known triple.
 *
 * Every generator is a pure function of a seeded random source, so the whole
 * world gets the same ladder on the same day.
 */

/** mulberry32 — small, fast, and identical in every browser. */
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const pick = (r, xs) => xs[Math.floor(r() * xs.length)];
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

/** A fraction, always reduced, rendered as a plain string. */
function frac(n, d) {
  const g = gcd(n, d) || 1;
  const num = n / g;
  const den = d / g;
  return den === 1 ? String(num) : `${num}/${den}`;
}

/** The decimal form, when it terminates — accepted alongside the fraction. */
function exactDecimal(n, d) {
  const value = n / d;
  const rounded = Number(value.toFixed(6));
  return Number.isInteger(value * 1000000) && String(rounded).length <= 10
    ? String(rounded)
    : null;
}

const SUP = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
const sup = (n) => String(n).split("").map((d) => SUP[+d]).join("");
/** x, x², x³ — never "x¹", which nobody writes. */
const pow = (n) => (n === 1 ? "x" : `x${sup(n)}`);

/** Signed term for building expressions: 3 → "+ 3", −3 → "− 3". */
const signed = (n) => (n < 0 ? `− ${Math.abs(n)}` : `+ ${n}`);

/* ── the twelve rungs ───────────────────────────────────────────────────── */

const BUILDERS = [
  // Grade 2 — adding and taking away inside 100.
  (r) => {
    const a = int(r, 12, 68);
    const b = int(r, 11, 30);
    return r() < 0.5
      ? { prompt: `${a} + ${b}`, answer: String(a + b) }
      : { prompt: `${a + b} − ${b}`, answer: String(a) };
  },

  // Grade 3 — times tables, forwards and backwards.
  (r) => {
    const a = int(r, 3, 9);
    const b = int(r, 4, 9);
    return r() < 0.5
      ? { prompt: `${a} × ${b}`, answer: String(a * b) }
      : { prompt: `${a * b} ÷ ${b}`, answer: String(a) };
  },

  // Grade 4 — long multiplication, and a fraction of a whole number.
  (r) => {
    if (r() < 0.6) {
      const a = int(r, 13, 48);
      const b = int(r, 3, 9);
      return { prompt: `${a} × ${b}`, answer: String(a * b) };
    }
    const part = pick(r, [2, 3, 4, 5]);
    const whole = part * int(r, 4, 15);
    return { prompt: `What is 1/${part} of ${whole}?`, answer: String(whole / part) };
  },

  // Grade 5 — adding fractions with unlike denominators.
  (r) => {
    const d1 = pick(r, [2, 3, 4, 5, 6, 8]);
    let d2 = pick(r, [3, 4, 5, 6, 8, 10]);
    if (d2 === d1) d2 = d1 === 4 ? 6 : 4;
    const n1 = int(r, 1, d1 - 1);
    const n2 = int(r, 1, d2 - 1);
    const num = n1 * d2 + n2 * d1;
    const den = d1 * d2;
    const answer = frac(num, den);
    const dec = exactDecimal(num, den);
    return {
      prompt: `${n1}/${d1} + ${n2}/${d2}`,
      answer,
      alts: dec ? [dec] : [],
      note: "Give it as a fraction in lowest terms.",
    };
  },

  // Grade 6 — percentages, and order of operations with a negative.
  (r) => {
    if (r() < 0.55) {
      const pct = pick(r, [5, 10, 15, 20, 25, 30, 40, 60, 75]);
      const base = int(r, 4, 40) * 20;
      return { prompt: `What is ${pct}% of ${base}?`, answer: String((pct * base) / 100) };
    }
    const a = int(r, 2, 9);
    const b = int(r, 2, 9);
    const c = int(r, 3, 20);
    return { prompt: `${-c} + ${a} × ${b}`, answer: String(-c + a * b) };
  },

  // Grade 7 — one-variable linear equations, built from the answer.
  (r) => {
    const x = int(r, 2, 12);
    const a = int(r, 2, 9);
    const b = int(r, 1, 20);
    return r() < 0.5
      ? { prompt: `Solve for x:   ${a}x + ${b} = ${a * x + b}`, answer: String(x) }
      : { prompt: `Solve for x:   ${a}x − ${b} = ${a * x - b}`, answer: String(x) };
  },

  // Grade 8 — powers, square roots, and a Pythagorean triple.
  (r) => {
    const roll = r();
    if (roll < 0.35) {
      const n = int(r, 4, 20);
      return { prompt: `√${n * n}`, answer: String(n) };
    }
    if (roll < 0.7) {
      const base = int(r, 2, 6);
      const exp = int(r, 2, 4);
      return { prompt: `${base}${sup(exp)}`, answer: String(base ** exp) };
    }
    const [a, b, c] = pick(r, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25]]);
    return {
      prompt: `A right triangle has legs ${a} and ${b}. How long is the hypotenuse?`,
      answer: String(c),
    };
  },

  // Grade 9 — quadratics, built from the roots so they always factor.
  (r) => {
    const p = int(r, 1, 9);
    let q = int(r, 1, 9);
    if (q === p) q = p === 9 ? 2 : p + 1;
    const sum = p + q;
    const prod = p * q;
    return {
      prompt: `Solve:   x² − ${sum}x + ${prod} = 0`,
      answer: `${Math.min(p, q)}, ${Math.max(p, q)}`,
      note: "Two roots — separate them with a comma.",
    };
  },

  // Grade 10 — geometry, kept to whole numbers or a multiple of π.
  (r) => {
    const roll = r();
    if (roll < 0.35) {
      const rad = int(r, 2, 12);
      return {
        prompt: `A circle has radius ${rad}. What is its area, in terms of π?`,
        answer: `${rad * rad}π`,
        alts: [`${rad * rad}pi`],
      };
    }
    if (roll < 0.7) {
      const base = int(r, 2, 20) * 2;
      const height = int(r, 3, 18);
      return {
        prompt: `A triangle has base ${base} and height ${height}. What is its area?`,
        answer: String((base * height) / 2),
      };
    }
    const sides = pick(r, [5, 6, 7, 8, 9, 10, 12]);
    return {
      prompt: `What do the interior angles of a regular ${sides}-sided polygon add up to, in degrees?`,
      answer: String((sides - 2) * 180),
    };
  },

  // Grade 11 — logs and arithmetic sequences.
  (r) => {
    if (r() < 0.5) {
      const base = pick(r, [2, 3, 5, 10]);
      const exp = int(r, 2, base === 2 ? 8 : base === 3 ? 5 : 4);
      return { prompt: `Evaluate:   log${sub(base)} ${base ** exp}`, answer: String(exp) };
    }
    const first = int(r, 2, 12);
    const step = int(r, 3, 11);
    const n = int(r, 8, 20);
    return {
      prompt: `An arithmetic sequence starts at ${first} and goes up by ${step} each time. What is the ${n}th term?`,
      answer: String(first + step * (n - 1)),
    };
  },

  // Grade 12 — trig values, complex arithmetic, composed functions.
  (r) => {
    const roll = r();
    if (roll < 0.34) {
      const [deg, value, alt] = pick(r, [
        [30, "1/2", "0.5"], [90, "1", null], [0, "0", null],
        [60, "√3/2", "sqrt3/2"], [45, "√2/2", "sqrt2/2"],
      ]);
      return { prompt: `sin ${deg}°`, answer: value, alts: alt ? [alt] : [] };
    }
    if (roll < 0.67) {
      const a = int(r, 2, 9);
      const b = int(r, 2, 9);
      return {
        prompt: `Multiply:   (${a} + ${b}i)(${a} − ${b}i)`,
        answer: String(a * a + b * b),
      };
    }
    const m = int(r, 2, 5);
    const c = int(r, 1, 9);
    const inner = int(r, 2, 5);
    return {
      prompt: `f(x) = ${m}x + ${c} and g(x) = x². Find f(g(${inner})).`,
      answer: String(m * inner * inner + c),
    };
  },

  // College — the calculus core.
  (r) => {
    const roll = r();
    if (roll < 0.34) {
      const k = int(r, 2, 9);
      const n = int(r, 2, 6);
      const co = k * n;
      const deg = n - 1;
      return {
        prompt: `Differentiate:   d/dx [ ${k}${pow(n)} ]`,
        answer: `${co}${pow(deg)}`,
        alts: deg === 1 ? [`${co}x`] : [`${co}x^${deg}`],
      };
    }
    if (roll < 0.67) {
      const n = int(r, 1, 5);
      const co = (n + 1) * int(r, 1, 4);
      const k = co / (n + 1);
      return {
        prompt: `Integrate:   ∫ ${co}${pow(n)} dx`,
        answer: `${k === 1 ? "" : k}${pow(n + 1)} + C`,
        alts: [`${k === 1 ? "" : k}x^${n + 1}+C`, `${k === 1 ? "" : k}x^${n + 1}`],
        note: "Include the constant of integration.",
      };
    }
    const a = int(r, 2, 9);
    return {
      // (x² − a²)/(x − a) cancels to x + a, so the limit is 2a.
      prompt: `Evaluate:   lim(x→${a})  (x² − ${a * a}) / (x − ${a})`,
      answer: String(2 * a),
    };
  },
];

const SUB = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"];
function sub(n) {
  return String(n).split("").map((d) => SUB[+d]).join("");
}

/**
 * The question at one rung on one day.
 *
 * The seed mixes the day and the rung so that two rungs on the same day are
 * independent, and the same rung on two days is different.
 */
export function questionFor(dayNumber, rung) {
  const r = seeded(dayNumber * 9973 + rung * 7919 + 17);
  const built = BUILDERS[rung](r);
  return { alts: [], note: null, ...built };
}

/** The whole ladder for a day. */
export function ladderFor(dayNumber) {
  return BUILDERS.map((_, i) => questionFor(dayNumber, i));
}
