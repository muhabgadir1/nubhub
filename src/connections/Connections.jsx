import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { PUZZLES } from "./puzzles";
import {
  MAX_MISTAKES, seededShuffle, judge, levelOf, alreadyGuessed, resultTitle, shareText,
} from "./logic";
import { dayNumber, pickForToday, msUntilTomorrow, formatCountdown, inBelgianTime, rolloverLocalTime } from "../lib/daily";
import { load, save, copyText } from "../lib/storage";
import { Icon } from "../lib/Icon";
import Celebration from "../lib/Celebration";
import "./connections.css";

/* Timings. The bounce reads the selection back to you before it is judged; the
   slide is how a solved row gets to the top without teleporting. */
const JUMP_STEP = 100;   // between one tile's bounce and the next
const JUMP_TOTAL = 700;  // last tile lands
const SLIDE = 350;
const SHAKE = 500;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* `dist` is indexed by mistakes made, 0 through 4 — so dist[0] is the count of
   puzzles solved without a single wrong guess, which is what "perfect" means
   here and what the card leads with. */
const EMPTY_STATS = {
  played: 0, wins: 0, streak: 0, maxStreak: 0, dist: [0, 0, 0, 0, 0], lastDay: null,
};

/**
 * How a tile should be set.
 *
 * Three shapes of content share this grid. A single character is a symbol
 * doing the work of a word — "$", "→", ":" — and wants to be big, not tiny. A
 * phrase like TAPE MEASURE can wrap, because it has a space to break at. A
 * long single word cannot: breaking WHEELBARROW across two lines is worse than
 * setting it small, so those shrink instead.
 */
function sizeClass(word) {
  if ([...word].length === 1) return " cx-tile--symbol";
  const parts = word.split(/\s+/);
  if (parts.length > 1) {
    const longest = Math.max(...parts.map((w) => w.length));
    return longest >= 9 ? " cx-tile--multi cx-tile--tiny" : " cx-tile--multi cx-tile--long";
  }
  if (word.length >= 10) return " cx-tile--tiny";
  if (word.length >= 8) return " cx-tile--long";
  return "";
}

export default function Connections({ navigate }) {
  const today = useMemo(() => dayNumber(), []);
  const groups = useMemo(() => pickForToday(PUZZLES), []);
  const allWords = useMemo(() => groups.flatMap((g) => g.words), [groups]);

  const saved = useMemo(() => {
    const s = load("connections.game", null);
    return s && s.day === today ? s : null;
  }, [today]);

  const [solved, setSolved] = useState(() =>
    (saved?.solved ?? []).map((name) => groups.find((g) => g.name === name)).filter(Boolean));
  const [order, setOrder] = useState(() => {
    const done = new Set((saved?.solved ?? []).flatMap((n) => groups.find((g) => g.name === n)?.words ?? []));
    const remaining = (saved?.order ?? seededShuffle(allWords, today * 7919)).filter((w) => !done.has(w));
    return remaining;
  });
  const [selected, setSelected] = useState([]);
  const [mistakes, setMistakes] = useState(() => saved?.mistakes ?? 0);
  const [history, setHistory] = useState(() => saved?.history ?? []);
  const [status, setStatus] = useState(() => saved?.status ?? "playing");
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState(() => load("connections.stats", EMPTY_STATS));
  const [partying, setPartying] = useState(false);
  const [jumping, setJumping] = useState([]);
  const [wrong, setWrong] = useState([]);
  const [toast, setToast] = useState(null);
  /* The rules greet you every time rather than once ever — one tap to get
     past, and nobody has to remember what the colours meant. */
  const [modal, setModal] = useState("help");

  /* Every step of a submit is awaited, so each one has to check that the
     component is still here before it touches state. The flag must be *set*
     on mount, not just cleared on unmount: React's development double-mount
     runs the cleanup once before the real mount, and a ref initialised only at
     construction would stay false from then on — every await would bail and
     the board would lock up on the first guess. */
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  useEffect(() => {
    save("connections.game", {
      day: today, order, solved: solved.map((g) => g.name), mistakes, history, status,
    });
  }, [today, order, solved, mistakes, history, status]);

  /* ---- the slide ----------------------------------------------------------
     A solved row has to travel from wherever its four tiles happen to sit up
     to the next free row. Grid reflow does that instantly and for free, which
     looks like a glitch, so the positions are measured before the reorder and
     the tiles are transformed back to where they were, then released — the
     browser animates the difference. */
  const tiles = useRef(new Map());
  const flipFrom = useRef(null);

  const measure = () => {
    const m = new Map();
    for (const [word, el] of tiles.current) if (el) m.set(word, el.getBoundingClientRect());
    return m;
  };

  useLayoutEffect(() => {
    const from = flipFrom.current;
    if (!from) return;
    flipFrom.current = null;
    const moved = [];
    for (const [word, before] of from) {
      const el = tiles.current.get(word);
      if (!el) continue;
      const after = el.getBoundingClientRect();
      const dx = before.left - after.left;
      const dy = before.top - after.top;
      if (!dx && !dy) continue;
      el.style.transition = "none";
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      moved.push(el);
    }
    if (!moved.length) return;
    requestAnimationFrame(() => {
      for (const el of moved) {
        el.style.transition = `transform ${SLIDE}ms cubic-bezier(0.2, 0, 0.2, 1)`;
        el.style.transform = "";
      }
    });
  }, [order]);

  /** Move a group's four tiles to the front, then turn them into a band. */
  const collapse = useCallback(async (group) => {
    flipFrom.current = measure();
    setOrder((prev) => [...group.words, ...prev.filter((w) => !group.words.includes(w))]);
    await sleep(SLIDE + 40);
    if (!alive.current) return;
    setSolved((prev) => [...prev, group]);
    setOrder((prev) => prev.filter((w) => !group.words.includes(w)));
  }, []);

  /** Count the finished game once, and roll the streak forward or reset it. */
  const record = useCallback((won, mistakesMade) => {
    setStats((prev) => {
      if (prev.lastDay === today) return prev; // already counted; don't double up
      const streak = prev.lastDay === today - 1 ? prev.streak + 1 : 1;
      const next = {
        played: prev.played + 1,
        wins: prev.wins + (won ? 1 : 0),
        streak: won ? streak : 0,
        maxStreak: Math.max(prev.maxStreak, won ? streak : 0),
        dist: prev.dist.map((n, i) => (won && i === mistakesMade ? n + 1 : n)),
        lastDay: today,
      };
      save("connections.stats", next);
      return next;
    });
  }, [today]);

  const flash = useCallback(async (text, ms = 1000) => {
    setToast({ text, fading: false });
    await sleep(ms);
    if (!alive.current) return;
    setToast((t) => (t ? { ...t, fading: true } : t));
    await sleep(250);
    if (alive.current) setToast(null);
  }, []);

  const toggle = (word) => {
    if (busy || status !== "playing") return;
    setSelected((prev) =>
      prev.includes(word) ? prev.filter((w) => w !== word)
        : prev.length < 4 ? [...prev, word] : prev);
  };

  const shuffle = () => {
    if (busy) return;
    setOrder((prev) => seededShuffle(prev, Math.floor(Math.random() * 1e9)));
  };

  const submit = async () => {
    if (busy || selected.length !== 4 || status !== "playing") return;

    if (alreadyGuessed(selected, history)) {
      flash("Already guessed!");
      return;
    }

    setBusy(true);
    const guess = [...selected];

    setJumping(guess);
    await sleep(JUMP_TOTAL);
    if (!alive.current) return;
    setJumping([]);

    const { group, away } = judge(guess, groups);
    const nextHistory = [...history, guess];
    setHistory(nextHistory);

    if (group) {
      setSelected([]);
      await collapse(group);
      if (!alive.current) return;
      if (solved.length + 1 === 4) {
        setStatus("won");
        record(true, mistakes);
        // A beat to let the last band land before the kisses start.
        await sleep(650);
        if (alive.current) setPartying(true);
      }
      setBusy(false);
      return;
    }

    // Wrong. Shake, dock a mistake, and say so if they were one word off.
    setWrong(guess);
    if (away === 1) flash("One away...");
    await sleep(SHAKE);
    if (!alive.current) return;
    setWrong([]);

    const used = mistakes + 1;
    setMistakes(used);
    if (used < MAX_MISTAKES) {
      setBusy(false);
      return;
    }

    // Out of mistakes: hand back the answers, one row at a time.
    setStatus("lost");
    record(false, MAX_MISTAKES);
    setSelected([]);
    const left = groups
      .filter((g) => !solved.some((s) => s.name === g.name))
      .sort((a, b) => a.level - b.level);
    for (const g of left) {
      await sleep(500);
      if (!alive.current) return;
      await collapse(g);
    }
    await sleep(700);
    if (alive.current) { setModal("result"); setBusy(false); }
  };

  /* Dismissing the rules puts you on the board — unless today is already
     played out, in which case the board is not what you came back for. */
  const closeHelp = () => setModal(status === "playing" ? null : "result");
  const perfect = status === "won" && mistakes === 0;
  const remaining = MAX_MISTAKES - mistakes;

  return (
    <div className="cx nub-room">
      <header className="cx-header">
        <div className="cx-header__side">
          <button className="nub-backpill" onClick={() => navigate("/")}>
            <Icon name="back" /><span className="nub-backpill__label">NUBHUB</span>
          </button>
        </div>
        <h1 className="cx-title">Connect<em>NUB</em></h1>
        <div className="cx-header__side cx-header__side--right">
          <button className="nub-icon" onClick={() => setModal("help")} aria-label="How to play"><Icon name="help" /></button>
          {status !== "playing" && (
            <button className="nub-icon" onClick={() => setModal("result")} aria-label="Results"><Icon name="stats" /></button>
          )}
        </div>
      </header>

      <main className="cx-main">
        <p className="cx-instruction">Create four groups of four!</p>

        <div className="cx-boardwrap">
          {toast && (
            <div className="cx-toastwrap">
              <div className={`nub-toast${toast.fading ? " nub-toast--out" : ""}`}>{toast.text}</div>
            </div>
          )}
          <div className="cx-stack">
            {solved.map((g) => (
              <div className={`cx-solved cx-solved--${g.level}`} key={g.name}>
                <div className="cx-solved__name">{g.name}</div>
                <div className="cx-solved__words">{g.words.join(", ")}</div>
              </div>
            ))}
            <div className="cx-board">
              {order.map((word) => (
                <button
                  key={word}
                  ref={(el) => { if (el) tiles.current.set(word, el); else tiles.current.delete(word); }}
                  className={
                    "cx-tile" + sizeClass(word) +
                    (selected.includes(word) ? " cx-tile--selected" : "") +
                    (jumping.includes(word) ? " cx-tile--jump" : "") +
                    (wrong.includes(word) ? " cx-tile--wrong" : "")
                  }
                  style={jumping.includes(word) ? { animationDelay: `${jumping.indexOf(word) * JUMP_STEP}ms` } : undefined}
                  onClick={() => toggle(word)}
                  aria-pressed={selected.includes(word)}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="cx-mistakes">
          {status === "playing" && (
            <>
              <span>Mistakes remaining:</span>
              <span className="cx-dots">
                {Array.from({ length: MAX_MISTAKES }, (_, i) => (
                  <span key={i} className={`cx-dot${i >= remaining ? " cx-dot--gone" : ""}`} />
                ))}
              </span>
            </>
          )}
        </div>

        {status === "playing" ? (
          <div className="cx-controls">
            <button className="nub-btn nub-btn--ghost cx-shuffle" onClick={shuffle} disabled={busy}>
              <Icon name="shuffle" /> Shuffle
            </button>
            <button className="nub-btn nub-btn--ghost" onClick={() => setSelected([])} disabled={busy || !selected.length}>
              Deselect all
            </button>
            <button
              /* Quiet until the guess is complete, then the green one — the
                 button itself tells you whether you have picked four. */
              className={`nub-btn ${selected.length === 4 && !busy ? "nub-btn--go" : "nub-btn--ghost"}`}
              onClick={submit}
              disabled={busy || selected.length !== 4}
            >
              Submit
            </button>
          </div>
        ) : (
          <div className="cx-controls">
            <button className="nub-btn nub-btn--go" onClick={() => setModal("result")}>See results</button>
          </div>
        )}
      </main>

      {partying && (
        <Celebration
          headline={perfect ? "Perfect!" : "Bisous!"}
          sub={perfect
            ? "All four groups, not one mistake."
            : `All four groups with ${mistakes} mistake${mistakes === 1 ? "" : "s"} to spare.`}
          onStats={() => { setPartying(false); setModal("result"); }}
        />
      )}

      {modal === "help" && <HelpModal onClose={closeHelp} done={status !== "playing"} />}
      {modal === "result" && (
        <ResultModal
          day={today} groups={groups} history={history} mistakes={mistakes}
          won={status === "won"} stats={stats} onClose={() => setModal(null)} flash={flash}
        />
      )}
    </div>
  );
}

/* ---------- modals ---------- */

function Modal({ children, onClose }) {
  return (
    <div className="nub-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="nub-modal nub-card cx-modal-center">
        <button className="nub-modal__close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        {children}
      </div>
    </div>
  );
}

function HelpModal({ onClose, done }) {
  return (
    <Modal onClose={onClose}>
      <h2>How to play</h2>
      <p style={{ textAlign: "center" }}><strong>Find groups of four items that share something in common.</strong></p>
      <hr />
      <p>Select four items and tap <strong>Submit</strong> to check if your guess is correct.</p>
      <p>Find the groups without making 4 mistakes!</p>
      <hr />
      <p><strong>Category examples</strong></p>
      <p>
        FISH: Bass, Flounder, Salmon, Trout<br />
        FIRE ___: Ant, Drill, Island, Opal
      </p>
      <p>Categories will always be more specific than "5-LETTER WORDS", "NAMES" or "VERBS."</p>
      <hr />
      <p style={{ textAlign: "center" }}>Each puzzle has exactly one solution. Watch out for words that seem to belong to multiple categories!</p>
      <div className="cx-swatches">
        <div className="cx-swatch cx-solved--0" /><div className="cx-swatch cx-solved--1" />
        <div className="cx-swatch cx-solved--2" /><div className="cx-swatch cx-solved--3" />
      </div>
      <p style={{ textAlign: "center" }}>Each group is assigned a colour, from the most straightforward on the left to the trickiest on the right.</p>
      <div className="nub-modal__cta">
        <button className="nub-btn nub-btn--go" onClick={onClose}>
          {done ? "See results" : "Play"}
        </button>
      </div>
    </Modal>
  );
}

function ResultModal({ day, groups, history, mistakes, won, stats, onClose, flash }) {
  const [left, setLeft] = useState(msUntilTomorrow());
  useEffect(() => {
    const id = setInterval(() => setLeft(msUntilTomorrow()), 1000);
    return () => clearInterval(id);
  }, []);

  const share = async () => {
    const text = shareText({ dayNumber: day, history, groups });
    if (navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
      try { await navigator.share({ text }); return; } catch { /* dismissed */ }
    }
    flash(await copyText(text) ? "Copied results to clipboard" : "Could not copy", 1400);
  };

  return (
    <Modal onClose={onClose}>
      <h2>{resultTitle(mistakes, won)}</h2>
      <div className="cx-sublabel">ConnectNUB #{day}</div>
      <div className="cx-grid">
        {history.map((guess, i) => (
          <div className="cx-grid__row" key={i}>
            {guess.map((w) => (
              <div key={w} className={`cx-grid__cell cx-grid__cell--${levelOf(w, groups)}`} />
            ))}
          </div>
        ))}
      </div>

      <hr />
      <div className="cx-sublabel">Statistics</div>
      <div className="cx-stats">
        <div className="cx-stat"><b>{stats.played}</b><span>Completed</span></div>
        <div className="cx-stat"><b>{stats.played ? Math.round((stats.wins / stats.played) * 100) : 0}</b><span>Win %</span></div>
        <div className="cx-stat"><b>{stats.streak}</b><span>Current Streak</span></div>
        <div className="cx-stat"><b>{stats.maxStreak}</b><span>Max Streak</span></div>
      </div>
      <div className="cx-perfect"><b>{stats.dist[0]}</b><span>Perfect Puzzles</span></div>

      <div className="cx-sublabel">Mistake Distribution</div>
      <div className="cx-dist">
        {stats.dist.map((n, i) => {
          const most = Math.max(1, ...stats.dist);
          return (
            <div className="cx-dist__row" key={i}>
              <div className="cx-dist__n">{i}</div>
              <div
                className={`cx-dist__bar${won && i === mistakes ? " cx-dist__bar--current" : ""}`}
                style={{ width: `${(n / most) * 100}%` }}
              >
                {n}
              </div>
            </div>
          );
        })}
      </div>

      <hr />
      <div className="cx-sublabel">Next puzzle in</div>
      <div className="cx-countdown">{formatCountdown(left)}</div>
      <div className="cx-rollover">
        midnight in Belgium
        {!inBelgianTime() && <> · {rolloverLocalTime()} here</>}
      </div>
      <button className="nub-btn nub-btn--go cx-share" onClick={share}>Share Your Results</button>
    </Modal>
  );
}
