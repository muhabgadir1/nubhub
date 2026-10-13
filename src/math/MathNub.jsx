import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ladderFor } from "./generate";
import {
  ATTEMPTS, LEVELS, RUNGS, STREAK_TARGET,
  isCorrect, resultTitle, shareText, verdict,
} from "./logic";
import { dayNumber, msUntilTomorrow, formatCountdown, inBelgianTime, rolloverLocalTime } from "../lib/daily";
import { load, save, copyText } from "../lib/storage";
import { Icon } from "../lib/Icon";
import Celebration from "../lib/Celebration";
import "./math.css";

/* A beat to read "Correct" before the next rung slides in. Shorter and the
   answer you just got right is gone before you have seen it land. */
const ADVANCE = 900;

const EMPTY_STATS = {
  played: 0, kept: 0, streak: 0, maxStreak: 0, best: 0,
  dist: Array(RUNGS + 1).fill(0), lastDay: null,
};

/** A phone keyboard has none of these, and hunting for them is giving up. */
const PAD = ["π", "√", "^", "/", "(", ")", "−", ",", "²", "³"];

export default function MathNub({ navigate }) {
  const today = useMemo(() => dayNumber(), []);
  const ladder = useMemo(() => ladderFor(today), [today]);

  const saved = useMemo(() => {
    const s = load("math.game", null);
    return s && s.day === today ? s : null;
  }, [today]);

  const [rung, setRung] = useState(() => saved?.rung ?? 0);
  const [used, setUsed] = useState(() => saved?.used ?? 0);
  const [attemptsUsed, setAttemptsUsed] = useState(() => saved?.attemptsUsed ?? []);
  const [status, setStatus] = useState(() => saved?.status ?? "playing");
  const [stats, setStats] = useState(() => load("math.stats", EMPTY_STATS));

  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState(null); // "right" | "wrong"
  const [busy, setBusy] = useState(false);
  const [partying, setPartying] = useState(false);
  /* The rules greet you every time rather than once ever — twelve rungs and
     three tries is worth restating, and it is one tap to get past. */
  const [modal, setModal] = useState("help");

  const box = useRef(null);
  const timers = useRef([]);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    save("math.game", { day: today, rung, used, attemptsUsed, status });
  }, [today, rung, used, attemptsUsed, status]);

  const question = ladder[Math.min(rung, RUNGS - 1)];
  const level = LEVELS[Math.min(rung, RUNGS - 1)];
  const over = status !== "playing";

  /** Count the finished run once, and roll the streak forward or reset it. */
  const record = useCallback((cleared) => {
    setStats((prev) => {
      if (prev.lastDay === today) return prev;
      const kept = cleared >= STREAK_TARGET;
      const streak = prev.lastDay === today - 1 ? prev.streak + 1 : 1;
      const next = {
        played: prev.played + 1,
        kept: prev.kept + (kept ? 1 : 0),
        streak: kept ? streak : 0,
        maxStreak: Math.max(prev.maxStreak, kept ? streak : 0),
        best: Math.max(prev.best, cleared),
        dist: prev.dist.map((n, i) => (i === cleared ? n + 1 : n)),
        lastDay: today,
      };
      save("math.stats", next);
      return next;
    });
  }, [today]);

  const submit = useCallback(() => {
    if (over || busy || !input.trim()) return;

    if (isCorrect(input, question)) {
      setBusy(true);
      setFeedback("right");
      const tries = used + 1;
      const nextAttempts = [...attemptsUsed, tries];
      setAttemptsUsed(nextAttempts);

      later(() => {
        setFeedback(null);
        setInput("");
        setUsed(0);
        if (rung + 1 === RUNGS) {
          setStatus("done");
          record(RUNGS);
          later(() => setPartying(true), 500);
        } else {
          setRung(rung + 1);
          later(() => box.current?.focus(), 60);
        }
        setBusy(false);
      }, ADVANCE);
      return;
    }

    // Wrong. Spend a try, and if that was the last one the climb stops here.
    const spent = used + 1;
    setUsed(spent);
    setFeedback("wrong");
    setInput("");
    later(() => setFeedback(null), 900);

    if (spent >= ATTEMPTS) {
      setStatus("over");
      record(rung);
      later(() => setModal("result"), 2200);
    } else {
      later(() => box.current?.focus(), 60);
    }
  }, [over, busy, input, question, used, attemptsUsed, rung, record]);

  /** Insert a pad symbol where the cursor is, not just at the end. */
  const insert = (sym) => {
    const el = box.current;
    if (!el) return setInput((v) => v + sym);
    const start = el.selectionStart ?? input.length;
    const end = el.selectionEnd ?? input.length;
    const next = input.slice(0, start) + sym + input.slice(end);
    setInput(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + sym.length, start + sym.length);
    });
  };

  /* Dismissing the rules starts the climb — unless today's run is already
     finished, in which case the result is what you came back for. */
  const closeHelp = () => setModal(over ? "result" : null);
  const cleared = status === "done" ? RUNGS : attemptsUsed.length;

  return (
    <div className="mn nub-room">
      <header className="mn-header">
        <div className="mn-header__side">
          <button className="nub-backpill" onClick={() => navigate("/")}>
            <Icon name="back" /><span className="nub-backpill__label">NUBHUB</span>
          </button>
        </div>
        <h1 className="mn-title">Math<em>NUB</em></h1>
        <div className="mn-header__side mn-header__side--right">
          <button className="nub-icon" onClick={() => setModal("help")} aria-label="How to play"><Icon name="help" /></button>
          <button className="nub-icon" onClick={() => setModal("result")} aria-label="Statistics"><Icon name="stats" /></button>
        </div>
      </header>

      {/* The rail: one dot per rung, filling in behind you as you climb. */}
      <div className="mn-rail" role="progressbar" aria-valuemin={0} aria-valuemax={RUNGS} aria-valuenow={cleared}>
        {LEVELS.map((l, i) => {
          const done = i < attemptsUsed.length;
          const now = i === rung && !over;
          const failed = status === "over" && i === rung;
          return (
            <div className="mn-rung" key={l.key}>
              <div className="mn-rung__wrap">
                <div className={`mn-dot${done ? " mn-dot--done" : ""}${now ? " mn-dot--now" : ""}${failed ? " mn-dot--failed" : ""}`} />
                <span className={`mn-rung__label${now ? " mn-rung__label--now" : ""}${done ? " mn-rung__label--done" : ""}`}>
                  {l.label}
                </span>
              </div>
              {i < RUNGS - 1 && <div className={`mn-link${done ? " mn-link--done" : ""}`} />}
            </div>
          );
        })}
      </div>

      <main className="mn-main">
        {over ? (
          <div className="nub-card mn-card mn-over">
            <div className="mn-level">{resultTitle(cleared)}</div>
            <p className="mn-prompt">{cleared} of {RUNGS} rungs</p>
            {status === "over" && (
              <>
                <div className="mn-over__label">{level.name} — the answer was</div>
                <div className="mn-over__answer">{question.answer}</div>
              </>
            )}
            <p className="mn-note">{verdict(cleared)}</p>
            <button className="nub-btn nub-btn--go mn-submit" style={{ width: "100%", marginTop: 14 }}
              onClick={() => setModal("result")}>
              See results
            </button>
          </div>
        ) : (
          <>
            <div
              key={rung}
              className={`nub-card mn-card${feedback === "right" ? " mn-card--right" : ""}${feedback === "wrong" ? " mn-card--wrong" : ""}`}
            >
              <div className="mn-level">{level.name}</div>
              <div className="mn-topic">{level.topic}</div>
              <p className="mn-prompt">{question.prompt}</p>
              {question.note && <p className="mn-note">{question.note}</p>}
            </div>

            <div className="mn-answer">
              <input
                ref={box}
                className="mn-input"
                value={input}
                autoFocus
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                inputMode="text"
                placeholder="your answer"
                aria-label="Your answer"
                disabled={busy}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              />
              <button className="nub-btn nub-btn--go mn-submit" onClick={submit} disabled={busy || !input.trim()}>
                Answer
              </button>
            </div>

            <div className="mn-pad">
              {PAD.map((sym) => (
                <button key={sym} className="mn-pad__key" onClick={() => insert(sym)} tabIndex={-1}>
                  {sym}
                </button>
              ))}
            </div>

            <div className="mn-tries">
              <span>Tries left:</span>
              {Array.from({ length: ATTEMPTS }, (_, i) => (
                <span key={i} className={`mn-try${i >= ATTEMPTS - used ? " mn-try--gone" : ""}`} />
              ))}
            </div>

            <div className={`mn-verdict${feedback ? ` mn-verdict--${feedback}` : ""}`}>
              {feedback === "right" ? "Correct" : feedback === "wrong" ? "Not quite" : " "}
            </div>
          </>
        )}
      </main>

      {partying && (
        <Celebration
          headline="All twelve!"
          sub="Grade 2 to calculus without falling off. Bisous."
          onStats={() => { setPartying(false); setModal("result"); }}
        />
      )}

      {modal === "help" && <HelpModal onClose={closeHelp} done={over} />}
      {modal === "result" && (
        <ResultModal
          day={today} cleared={cleared} attemptsUsed={attemptsUsed}
          stats={stats} over={over} onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

/* ---------- modals ---------- */

function Modal({ children, onClose }) {
  return (
    <div className="nub-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="nub-modal nub-card" style={{ textAlign: "center" }}>
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
      <p style={{ textAlign: "center" }}>
        <strong>Twelve questions, Grade 2 up to college calculus.</strong>
      </p>
      <hr />
      <p>One question per rung. You get <strong>three tries</strong> at each.</p>
      <p>Miss all three and the climb stops there — you will see the answer, but not the rungs above it.</p>
      <p>Reach <strong>{LEVELS[STREAK_TARGET].name}</strong> or higher and your streak survives the day.</p>
      <hr />
      <p>
        Type the answer as you would write it. <strong>x = 6</strong> and <strong>6</strong> both count,
        so do <strong>12x³</strong> and <strong>12x^3</strong>, and <strong>49π</strong> and <strong>49pi</strong>.
        Two answers go in one box, separated by a comma.
      </p>
      <p>The row of buttons under the box types the symbols a phone keyboard hides.</p>
      <div className="nub-modal__cta">
        <button className="nub-btn nub-btn--go" onClick={onClose}>
          {done ? "See results" : "Start climbing"}
        </button>
      </div>
    </Modal>
  );
}

function ResultModal({ day, cleared, attemptsUsed, stats, over, onClose }) {
  const [left, setLeft] = useState(msUntilTomorrow());
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setLeft(msUntilTomorrow()), 1000);
    return () => clearInterval(id);
  }, []);

  const most = Math.max(1, ...stats.dist);
  const cells = LEVELS.map((_, i) => {
    if (i < cleared) return attemptsUsed[i] ?? 1;
    return i === cleared && over ? "stop" : 0;
  });

  const share = async () => {
    const text = shareText({ dayNumber: day, cleared, attemptsUsed });
    if (navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
      try { await navigator.share({ text }); return; } catch { /* dismissed */ }
    }
    setCopied(await copyText(text));
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <Modal onClose={onClose}>
      <h2>{resultTitle(cleared)}</h2>
      <div className="mn-over__label">MathNUB #{day} — {cleared}/{RUNGS}</div>
      <div className="mn-grid">
        {[cells.slice(0, 6), cells.slice(6)].map((row, i) => (
          <div className="mn-grid__row" key={i}>
            {row.map((c, j) => <div key={j} className={`mn-grid__cell mn-grid__cell--${c}`} />)}
          </div>
        ))}
      </div>

      <hr />
      <div className="mn-over__label">Statistics</div>
      <div className="mn-stats">
        <div className="mn-stat"><b>{stats.played}</b><span>Played</span></div>
        <div className="mn-stat"><b>{stats.best}</b><span>Best Climb</span></div>
        <div className="mn-stat"><b>{stats.streak}</b><span>Current Streak</span></div>
        <div className="mn-stat"><b>{stats.maxStreak}</b><span>Max Streak</span></div>
      </div>

      <div className="mn-over__label">How far you get</div>
      <div className="mn-dist">
        {stats.dist.map((n, i) => (
          <div className="mn-dist__row" key={i}>
            <div className="mn-dist__n">{i}</div>
            <div
              className={`mn-dist__bar${i === cleared ? " mn-dist__bar--current" : ""}`}
              style={{ width: `${(n / most) * 100}%` }}
            >
              {n}
            </div>
          </div>
        ))}
      </div>

      <hr />
      <div className="mn-over__label">Next ladder in</div>
      <div className="mn-prompt" style={{ fontVariantNumeric: "tabular-nums", margin: "4px 0" }}>
        {formatCountdown(left)}
      </div>
      <p className="mn-note" style={{ marginTop: 0 }}>
        midnight in Belgium{!inBelgianTime() && ` · ${rolloverLocalTime()} here`}
      </p>
      <button className="nub-btn nub-btn--go" style={{ width: "100%", marginTop: 10 }} onClick={share}>
        {copied ? "Copied!" : "Share Your Climb"}
      </button>
    </Modal>
  );
}
