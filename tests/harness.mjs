/**
 * The smallest thing that can fail a build. No dependencies, no watch mode —
 * `node tests/x.test.mjs` either prints ok lines and exits 0, or prints what
 * broke and exits 1.
 */
let failures = 0;
let count = 0;

export function test(name, fn) {
  count++;
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (err) {
    failures++;
    console.log(`  FAIL ${name}\n       ${err.message}`);
  }
}

export function eq(actual, expected, note = "") {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${note && note + ": "}expected ${b}, got ${a}`);
}

export function ok(value, note = "assertion failed") {
  if (!value) throw new Error(note);
}

export function done(suite) {
  console.log(`${suite}: ${count - failures}/${count} passed`);
  if (failures) process.exit(1);
}
