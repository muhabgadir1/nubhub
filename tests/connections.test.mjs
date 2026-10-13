import { test, eq, ok, done } from "./harness.mjs";
import {
  judge, levelOf, alreadyGuessed, seededShuffle, resultTitle, shareText, categoryKind, MAX_MISTAKES,
} from "../src/connections/logic.js";
import { PUZZLES } from "../src/connections/puzzles.js";

console.log("connections");

const GROUPS = [
  { level: 0, name: "ONE", words: ["A", "B", "C", "D"] },
  { level: 1, name: "TWO", words: ["E", "F", "G", "H"] },
  { level: 2, name: "THREE", words: ["I", "J", "K", "L"] },
  { level: 3, name: "FOUR", words: ["M", "N", "O", "P"] },
];

test("four from one group is a solve", () => {
  const { group, away } = judge(["D", "B", "A", "C"], GROUPS);
  eq(group.name, "ONE");
  eq(away, 0);
});

test("three from one group is one away", () => {
  eq(judge(["A", "B", "C", "E"], GROUPS).away, 1);
  eq(judge(["A", "B", "C", "E"], GROUPS).group, null);
});

test("two and two is two away, and says nothing helpful", () => {
  eq(judge(["A", "B", "E", "F"], GROUPS).away, 2);
});

test("one from each group is three away", () => {
  eq(judge(["A", "E", "I", "M"], GROUPS).away, 3);
});

test("a guess already made is caught whatever order it is in", () => {
  const history = [["A", "B", "C", "E"]];
  ok(alreadyGuessed(["E", "C", "B", "A"], history), "same four, shuffled");
  ok(!alreadyGuessed(["A", "B", "C", "D"], history), "a different four");
  ok(!alreadyGuessed(["A", "B", "C", "E"], []), "nothing guessed yet");
});

test("levelOf finds the colour a word belongs to", () => {
  eq(levelOf("A", GROUPS), 0);
  eq(levelOf("P", GROUPS), 3);
});

test("the same seed always gives the same board", () => {
  const words = GROUPS.flatMap((g) => g.words);
  eq(seededShuffle(words, 42), seededShuffle(words, 42));
  ok(seededShuffle(words, 42).join("") !== seededShuffle(words, 43).join(""), "different seeds differ");
});

test("shuffling keeps every word exactly once", () => {
  const words = GROUPS.flatMap((g) => g.words);
  const shuffled = seededShuffle(words, 7);
  eq(shuffled.length, 16);
  eq([...shuffled].sort(), [...words].sort());
});

test("the result title tracks how many mistakes it took", () => {
  eq(resultTitle(0, true), "Perfect!");
  eq(resultTitle(1, true), "Great!");
  eq(resultTitle(3, true), "Phew!");
  eq(resultTitle(4, false), "Next Time");
});

test("the share grid colours each square by the group the word is really in", () => {
  const history = [["A", "B", "C", "E"], ["A", "B", "C", "D"]];
  eq(shareText({ dayNumber: 3, history, groups: GROUPS }),
    "NUBHUB ConnectNUB\nPuzzle #3\n🟨🟨🟨🟩\n🟨🟨🟨🟨");
});

test("every puzzle is playable", () => {
  eq(MAX_MISTAKES, 4);
  PUZZLES.forEach((groups, i) => {
    const words = groups.flatMap((g) => g.words);
    eq(words.length, 16, `puzzle ${i + 1} word count`);
    eq(new Set(words).size, 16, `puzzle ${i + 1} has a repeated word`);
    eq([...groups.map((g) => g.level)].sort(), [0, 1, 2, 3], `puzzle ${i + 1} levels`);
    for (const g of groups) {
      ok(g.name.trim().length > 0, `puzzle ${i + 1} has an unnamed group`);
      // Each group must actually be solvable by its own four words.
      eq(judge(g.words, groups).group.name, g.name, `puzzle ${i + 1}: ${g.name}`);
    }
  });
});

test("category kinds are read correctly from their names", () => {
  eq(categoryKind("SPICES"), "category");
  eq(categoryKind("PARTS OF A CASTLE"), "category");
  eq(categoryKind("___ STORM"), "blank");
  eq(categoryKind("ANAGRAMS OF ANIMALS"), "wordplay");
  eq(categoryKind("DROP THE FIRST LETTER FOR A DRINK"), "wordplay");
  eq(categoryKind("SILENT FIRST LETTER"), "wordplay");
  eq(categoryKind("COUNTRIES HIDDEN INSIDE"), "wordplay");
  eq(categoryKind("RHYME WITH A BODY PART"), "wordplay");
  eq(categoryKind("ANIMALS PLUS A LETTER"), "wordplay");
  eq(categoryKind("FRUIT WITH ONE LETTER CHANGED"), "wordplay");
  // A name that gives nothing away can be told what it is.
  eq(categoryKind("EMOTICON EYES"), "category", "name alone reads as a category");
  eq(categoryKind("EMOTICON EYES", "wordplay"), "wordplay", "explicit kind wins");
});

/* The difficulty ladder is the game. These four tests are what stop a board
   from being four lists of things with colours stuck on afterwards. */

test("yellow and green are always plain categories", () => {
  // The easy end has to be reachable without spotting a trick, or there is no
  // way into the board at all.
  PUZZLES.forEach((groups, i) => {
    for (const g of groups.filter((x) => x.level <= 1)) {
      eq(categoryKind(g.name, g.kind), "category", `puzzle ${i + 1}: "${g.name}" at level ${g.level}`);
    }
  });
});

test("purple is never a plain category", () => {
  PUZZLES.forEach((groups, i) => {
    const purple = groups.find((g) => g.level === 3);
    ok(categoryKind(purple.name, purple.kind) !== "category",
      `puzzle ${i + 1}: purple "${purple.name}" is just a list of things`);
  });
});

test("every board mixes at least two kinds of category", () => {
  PUZZLES.forEach((groups, i) => {
    const kinds = new Set(groups.map((g) => categoryKind(g.name, g.kind)));
    ok(kinds.size >= 2, `puzzle ${i + 1} is all ${[...kinds][0]}`);
  });
});

test("the set as a whole keeps a wide spread of solution types", () => {
  const kinds = PUZZLES.flat().map((g) => categoryKind(g.name, g.kind));
  const count = (k) => kinds.filter((x) => x === k).length;
  ok(count("blank") >= 20, `only ${count("blank")} fill-in-the-blank groups`);
  ok(count("wordplay") >= 25, `only ${count("wordplay")} wordplay groups`);
  // And the tricks themselves must vary — twenty anagram puzzles is one idea,
  // not twenty. Names are normalised so "ANAGRAMS OF ANIMALS" and
  // "ANAGRAMS OF PLANETS" count once.
  const mechanics = new Set(
    PUZZLES.flat()
      .filter((g) => categoryKind(g.name, g.kind) === "wordplay")
      .map((g) => g.name.replace(/ (OF|FOR|WITH) .*/i, "").trim()),
  );
  ok(mechanics.size >= 20, `only ${mechanics.size} distinct wordplay mechanics`);
});

test("the tricky kinds concentrate at purple, where the scale puts them", () => {
  // Blue may occasionally take a blank, but a board whose lateral thinking sits
  // at blue while purple holds a list has its ladder upside down.
  const tricky = PUZZLES.flat().filter((g) => categoryKind(g.name, g.kind) !== "category");
  const atPurple = tricky.filter((g) => g.level === 3).length;
  ok(atPurple / tricky.length >= 0.65,
    `only ${atPurple} of ${tricky.length} non-category groups are purple`);
});

test("every tile holds something that will fit", () => {
  // A tile can hold a word, a symbol, or a short phrase. What it cannot hold is
  // a long single word, because there is nowhere to break it.
  const bad = [];
  for (const [i, groups] of PUZZLES.entries()) {
    for (const g of groups) {
      for (const w of g.words) {
        if (!w.trim()) bad.push(`puzzle ${i + 1}: empty tile`);
        const parts = w.split(/\s+/);
        const longest = Math.max(...parts.map((x) => x.length));
        if (longest > 12) bad.push(`puzzle ${i + 1}: "${w}" has an unbreakable ${longest}-char run`);
        if (w.length > 16) bad.push(`puzzle ${i + 1}: "${w}" is ${w.length} characters`);
      }
    }
  }
  eq(bad, []);
});

test("symbol tiles survive being single characters", () => {
  // The symbols board is the one that would break a renderer assuming words.
  const symbolBoards = PUZZLES.filter((g) => g.flat().some((x) => x.words.some((w) => [...w].length === 1)));
  ok(symbolBoards.length >= 1, "expected at least one board built from symbols");
  for (const groups of symbolBoards) {
    for (const g of groups) {
      for (const w of g.words) ok(w.length >= 1, "a symbol tile must not be empty");
    }
  }
});

done("connections");
