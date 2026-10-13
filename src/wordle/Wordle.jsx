import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadDictionary, isLoaded } from "./dictionary";
import { ANSWERS, LENGTHS } from "./answers";
import {
  DEFAULT_LENGTH, MIN_LENGTH, MAX_LENGTH, MAX_GUESSES, CORRECT, PRESENT, ABSENT,
  scoreGuess, keyboardState, hardModeViolation, praiseFor, shareText,
} from "./logic";
import { dayNumber, pickForToday, msUntilTomorrow, formatCountdown, inBelgianTime, rolloverLocalTime } from "../lib/daily";
import { load, save, copyText } from "../lib/storage";
import { Icon } from "../lib/Icon";
import Celebration from "../lib/Celebration";
import "./wordle.css";

/* How the reveal is timed. Each tile starts its flip 300ms after the one to
   its left and takes 500ms, so a row finishes 1.7s after you hit enter. The
   colour is swapped at the 250ms mark, when the tile is edge-on and the change
   is invisible. Slower than this drags; faster and you cannot read the row as
   it lands. */
const STAGGER = 300;
const FLIP = 500;
const COLOUR_AT = 250;

const ROWS = [
  "qwertyuiop".split(""),
  "asdfghjkl".split(""),
  ["enter", ..."zxcvbnm".split(""), "back"],
];

const EMPTY_STATS = { played: 0, wins: 0, streak: 0, maxStreak: 0, dist: [0, 0, 0, 0, 0, 0], lastDay: null };

/* Each word length is its own game: its own saved board, its own streak, its
   own distribution. Mixing a ten-letter run into a five-letter streak would
   make both numbers meaningless. */
const gameKey = (n) => (n === DEFAULT_LENGTH ? "wordle.game" : `wordle.game.${n}`);
const statsKey = (n) => (n === DEFAULT_LENGTH ? "wordle.stats" : `wordle.stats.${n}`);

/** A tile's state class, or "" while it is still just a typed letter. */
function tileClass(state) {
  if (state === CORRECT) return " wd-tile--correct";
  if (state === PRESENT) return " wd-tile--present";
  if (state === ABSENT) return " wd-tile--absent";
  return "";
}

export default function Wordle({ navigate }) {
  const today = useMemo(() => dayNumber(), []);

  /* No dark-mode switch: the whole site is the one dark room, so a toggle
     would only ever make this screen disagree with the rest of it. Hard mode,
     high contrast and word length stay — those change how the game plays. */
  const [settings, setSettings] = useState(() => {
    const s = load("wordle.settings", { hardMode: false, contrast: false, length: DEFAULT_LENGTH });
    // Guard the stored length: a hand-edited or outdated value would otherwise
    // index into a word list that does not exist.
    return { ...s, length: LENGTHS.includes(s.length) ? s.length : DEFAULT_LENGTH };
  });
  const length = settings.length;

  const answer = useMemo(() => pickForToday(ANSWERS[length]), [length]);
  const [stats, setStats] = useState(() => load(statsKey(length), EMPTY_STATS));

  // The saved game is only trusted if it belongs to today; a stale one is a
  // finished puzzle whose answer has since changed underneath it.
  const saved = useMemo(() => {
    const s = load(gameKey(length), null);
    return s && s.day === today ? s : null;
  }, [today, length]);

  const [guesses, setGuesses] = useState(() => saved?.guesses ?? []);
  const [current, setCurrent] = useState("");
  const [status, setStatus] = useState(() => saved?.status ?? "playing");
  /* Rows whose flip has finished. The keyboard reads from this rather than
     from `guesses`, so keys do not light up before the row that revealed
     them. */
  const [revealed, setRevealed] = useState(() => saved?.guesses?.length ?? 0);
  const [reveal, setReveal] = useState(null); // { row, done } mid-animation
  const [dancing, setDancing] = useState(false);
  const [partying, setPartying] = useState(false);
  const [shake, setShake] = useState(false);
  const [toasts, setToasts] = useState([]);
  /* The rules greet you every time rather than once ever. It is one tap to
     get past, and it means nobody has to remember what yellow meant. */
  const [modal, setModal] = useState("help");

  const timers = useRef([]);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => { save("wordle.settings", settings); }, [settings]);
  useEffect(() => { save(gameKey(length), { day: today, guesses, status }); }, [length, today, guesses, status]);

  /* Changing length mid-session means a different word, a different board and a
     different saved game, so everything is reloaded rather than carried over. */
  useEffect(() => {
    const s = load(gameKey(length), null);
    const fresh = s && s.day === today ? s : null;
    setGuesses(fresh?.guesses ?? []);
    setStatus(fresh?.status ?? "playing");
    setRevealed(fresh?.guesses?.length ?? 0);
    setStats(load(statsKey(length), EMPTY_STATS));
    setCurrent("");
    setReveal(null);
    setDancing(false);
    setPartying(false);
    setToasts([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length]);

  /* Six through ten are separate downloads, so the board waits on one before it
     will judge a guess. Five is bundled and this resolves on the spot. */
  const [words, setWords] = useState(() => null);
  useEffect(() => {
    let current = true;
    setWords(null);
    loadDictionary(length).then((set) => { if (current) setWords(set); });
    return () => { current = false; };
  }, [length]);

  const toast = useCallback((text, ms = 1800) => {
    const id = Math.random();
    setToasts((t) => [...t, { id, text, fading: false }]);
    if (ms === Infinity) return;
    later(() => setToasts((t) => t.map((x) => (x.id === id ? { ...x, fading: true } : x))), ms);
    later(() => setToasts((t) => t.filter((x) => x.id !== id)), ms + 300);
  }, []);

  const keys = useMemo(
    () => keyboardState(guesses.slice(0, revealed), answer),
    [guesses, revealed, answer],
  );

  /** Record the finished game once, and roll the streak forward or reset it. */
  const record = useCallback((won, rows) => {
    setStats((prev) => {
      if (prev.lastDay === today) return prev; // already counted; don't double up
      const streak = prev.lastDay === today - 1 ? prev.streak + 1 : 1;
      const next = {
        played: prev.played + 1,
        wins: prev.wins + (won ? 1 : 0),
        streak: won ? streak : 0,
        maxStreak: Math.max(prev.maxStreak, won ? streak : 0),
        dist: prev.dist.map((n, i) => (won && i === rows - 1 ? n + 1 : n)),
        lastDay: today,
      };
      save(statsKey(length), next);
      return next;
    });
  }, [today, length]);

  const submit = useCallback(() => {
    if (status !== "playing" || reveal) return;

    if (!words) return toast("Still loading the word list…");

    if (current.length < length) {
      setShake(true);
      later(() => setShake(false), 600);
      return toast("Not enough letters");
    }
    if (!words.has(current)) {
      setShake(true);
      later(() => setShake(false), 600);
      return toast("Not in word list");
    }
    if (settings.hardMode) {
      const problem = hardModeViolation(current, guesses[guesses.length - 1], answer);
      if (problem) {
        setShake(true);
        later(() => setShake(false), 600);
        return toast(problem);
      }
    }

    const row = guesses.length;
    const next = [...guesses, current];
    setGuesses(next);
    setCurrent("");
    setReveal({ row, done: 0 });

    // Colour each tile as it turns edge-on.
    for (let i = 0; i < length; i++) {
      later(() => setReveal({ row, done: i + 1 }), i * STAGGER + COLOUR_AT);
    }

    later(() => {
      setReveal(null);
      setRevealed(next.length);

      const won = current === answer;
      const out = won || next.length === MAX_GUESSES;
      if (!out) return;

      setStatus(won ? "won" : "lost");
      record(won, next.length);

      if (won) {
        setDancing(true);
        // The row dances first and the kisses land on top of it — starting both
        // at once buries the thing you actually just did.
        later(() => setPartying(true), 900);
      } else {
        toast(answer.toUpperCase(), Infinity);
        later(() => setModal("stats"), 1400);
      }
    }, (length - 1) * STAGGER + FLIP);
  }, [status, reveal, current, guesses, answer, length, words, settings.hardMode, toast, record]);

  const press = useCallback((key) => {
    if (modal || reveal || status !== "playing") return;
    if (key === "enter") return submit();
    if (key === "back") return setCurrent((c) => c.slice(0, -1));
    if (/^[a-z]$/.test(key)) setCurrent((c) => (c.length < length ? c + key : c));
  }, [modal, reveal, status, submit, length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") return setModal(null);
      if (e.key === "Enter") { e.preventDefault(); return press("enter"); }
      if (e.key === "Backspace") { e.preventDefault(); return press("back"); }
      const k = e.key.toLowerCase();
      if (/^[a-z]$/.test(k)) press(k);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  /* Dismissing the rules puts you on the board — unless today is already
     played out, in which case the board is not what you came back for. */
  const closeHelp = () => setModal(status === "playing" ? null : "stats");

  return (
    <div className={`wd nub-room${settings.contrast ? " wd--contrast" : ""}`}>
      <header className="wd-header">
        <div className="wd-header__side">
          <button className="nub-backpill" onClick={() => navigate("/")}>
            <Icon name="back" /><span className="nub-backpill__label">NUBHUB</span>
          </button>
        </div>
        <h1 className="wd-title">Word<em>NUB</em></h1>
        <div className="wd-header__side wd-header__side--right">
          <button className="nub-icon" onClick={() => setModal("help")} aria-label="How to play"><Icon name="help" /></button>
          <button className="nub-icon" onClick={() => setModal("stats")} aria-label="Statistics"><Icon name="stats" /></button>
          <button className="nub-icon" onClick={() => setModal("settings")} aria-label="Settings"><Icon name="gear" /></button>
        </div>
      </header>

      <div className="wd-boardwrap">
        <div className="wd-toasts">
          {toasts.map((t) => (
            <div key={t.id} className={`nub-toast${t.fading ? " nub-toast--out" : ""}`}>{t.text}</div>
          ))}
        </div>

        {/* The long lists are a real download — 650KB for the ten-letter one —
            so say so rather than silently refusing the first guess. */}
        {!words && <div className="wd-loading">Fetching the {length}-letter word list…</div>}

        <div className="wd-board" style={{ "--cols": length }}>
          {Array.from({ length: MAX_GUESSES }, (_, row) => {
            const committed = guesses[row];
            const word = committed ?? (row === guesses.length ? current : "");
            const score = committed ? scoreGuess(committed, answer) : null;
            const flipping = reveal?.row === row;
            // A committed row shows its colours immediately, unless it is the
            // row currently turning over — then only as far as the flip has got.
            const shown = !committed ? 0 : flipping ? reveal.done : length;
            return (
              <div key={row} className={`wd-row${shake && row === guesses.length ? " wd-row--shake" : ""}`}>
                {Array.from({ length }, (_, i) => {
                  const ch = word[i] ?? "";
                  const state = score && i < shown ? score[i] : null;
                  const cls = [
                    "wd-tile",
                    ch && !state ? "wd-tile--filled" : "",
                    flipping ? "wd-tile--flip" : "",
                    dancing && status === "won" && row === guesses.length - 1 ? "wd-tile--win" : "",
                  ].join(" ") + tileClass(state);
                  const delay = flipping ? i * STAGGER : dancing ? i * 100 : 0;
                  return (
                    <div key={i} className={cls} style={delay ? { animationDelay: `${delay}ms` } : undefined}>
                      {ch}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="wd-keyboard">
        {ROWS.map((row, i) => (
          <div className="wd-krow" key={i}>
            {i === 1 && <div className="wd-spacer" />}
            {row.map((key) => (
              <button
                key={key}
                className={`wd-key${key.length > 1 ? " wd-key--wide" : ""} ${
                  keys[key] === CORRECT ? "wd-key--correct" :
                  keys[key] === PRESENT ? "wd-key--present" :
                  keys[key] === ABSENT ? "wd-key--absent" : ""}`}
                /* Drop focus straight after the press. A clicked <button>
                   keeps it, and a key left ringed reads as still-held. */
                onClick={(e) => { e.currentTarget.blur(); press(key); }}
                aria-label={key === "back" ? "Backspace" : key}
              >
                {key === "back" ? <Icon name="backspace" /> : key === "enter" ? "enter" : key}
              </button>
            ))}
            {i === 1 && <div className="wd-spacer" />}
          </div>
        ))}
      </div>

      {partying && (
        <Celebration
          headline={praiseFor(guesses.length)}
          sub={`${answer.toUpperCase()} in ${guesses.length} ${guesses.length === 1 ? "guess" : "guesses"}. Bisous.`}
          onStats={() => { setPartying(false); setModal("stats"); }}
        />
      )}

      {modal === "help" && <HelpModal onClose={closeHelp} done={status !== "playing"} />}
      {modal === "settings" && (
        <SettingsModal
          settings={settings} setSettings={setSettings}
          onClose={() => setModal(null)} onSuggest={() => setModal("suggest")}
        />
      )}
      {modal === "suggest" && <SuggestModal onClose={() => setModal(null)} toast={toast} />}
      {modal === "stats" && (
        <StatsModal
          stats={stats} status={status} guesses={guesses} answer={answer}
          day={today} settings={settings} onClose={() => setModal(null)} toast={toast}
        />
      )}
    </div>
  );
}

/* ---------- modals ---------- */

function Modal({ children, onClose }) {
  return (
    <div className="nub-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="nub-modal nub-card">
        <button className="nub-modal__close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        {children}
      </div>
    </div>
  );
}

function ExampleRow({ word, highlight, state }) {
  return (
    <div className="wd-example">
      {word.split("").map((ch, i) => (
        <div
          key={i}
          className={`wd-tile${i === highlight ? ` wd-example__reveal${tileClass(state)}` : ""}`}
        >
          {ch}
        </div>
      ))}
    </div>
  );
}

function HelpModal({ onClose, done }) {
  return (
    <Modal onClose={onClose}>
      <h2>How to play</h2>
      <p><strong>Guess the WordNUB in 6 tries.</strong></p>
      <p>Each guess must be a valid 5-letter word. Hit the enter button to submit.</p>
      <p>After each guess, the colour of the tiles will change to show how close your guess was to the word.</p>
      <hr />
      <p><strong>Examples</strong></p>
      <ExampleRow word="weary" highlight={0} state={CORRECT} />
      <p><strong>W</strong> is in the word and in the correct spot.</p>
      <ExampleRow word="pills" highlight={1} state={PRESENT} />
      <p><strong>I</strong> is in the word but in the wrong spot.</p>
      <ExampleRow word="vague" highlight={3} state={ABSENT} />
      <p><strong>U</strong> is not in the word in any spot.</p>
      <hr />
      <p><strong>A new word every day, at midnight in Belgium.</strong></p>
      <div className="nub-modal__cta">
        <button className="nub-btn nub-btn--go" onClick={onClose}>
          {done ? "See results" : "Play"}
        </button>
      </div>
    </Modal>
  );
}

function Switch({ on, onChange, label }) {
  return (
    <button
      className={`wd-switch${on ? " wd-switch--on" : ""}`}
      role="switch" aria-checked={on} aria-label={label}
      onClick={() => onChange(!on)}
    >
      <span className="wd-switch__knob" />
    </button>
  );
}

function SettingsModal({ settings, setSettings, onClose, onSuggest }) {
  const set = (k) => (v) => setSettings((s) => ({ ...s, [k]: v }));
  const pick = LENGTHS.indexOf(settings.length);
  return (
    <Modal onClose={onClose}>
      <h2>Settings</h2>
      <div className="wd-setting wd-setting--stack">
        <div>
          <div className="wd-setting__name">Word length</div>
          <div className="wd-setting__desc">
            Longer words are their own daily puzzle, with their own streak. Still six guesses.
          </div>
        </div>
        <div className="nub-seg wd-lengths" style={{ "--count": LENGTHS.length, "--pick": pick }}>
          {LENGTHS.map((n) => (
            <button
              key={n}
              className={`nub-seg__opt${n === settings.length ? " is-on" : ""}`}
              onClick={() => set("length")(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <div className="wd-setting">
        <div>
          <div className="wd-setting__name">Hard Mode</div>
          <div className="wd-setting__desc">Any revealed hint must be used in every later guess</div>
        </div>
        <Switch on={settings.hardMode} onChange={set("hardMode")} label="Hard mode" />
      </div>
      <div className="wd-setting">
        <div>
          <div className="wd-setting__name">High Contrast</div>
          <div className="wd-setting__desc">Orange and blue instead of green and yellow</div>
        </div>
        <Switch on={settings.contrast} onChange={set("contrast")} label="High contrast mode" />
      </div>
      <button className="nub-btn nub-btn--outline wd-suggest" onClick={onSuggest}>
        Suggest a word
      </button>
    </Modal>
  );
}

/**
 * Send a word in for a future puzzle.
 *
 * Typed twice, and the two have to match. There is no spell-check to lean on
 * and no way to correct a word once it is in the list, so a single typo would
 * quietly become somebody's unguessable Tuesday. Retyping catches exactly the
 * mistake that matters — the one the sender cannot see.
 *
 * Posts to Netlify Forms, which needs no backend: the hidden form in
 * index.html is what the build scanner picks up, and this posts the same
 * field names to it.
 */
function SuggestModal({ onClose, toast }) {
  const [word, setWord] = useState("");
  const [again, setAgain] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);

  const clean = word.trim().toLowerCase();
  const repeat = again.trim().toLowerCase();
  const problem =
    !clean ? "Type a word."
    : !/^[a-z]+$/.test(clean) ? "Letters only — no spaces, hyphens or accents."
    : clean.length < MIN_LENGTH || clean.length > MAX_LENGTH
      ? `Between ${MIN_LENGTH} and ${MAX_LENGTH} letters. That one is ${clean.length}.`
    : !repeat ? "Type it a second time to confirm the spelling."
    : clean !== repeat ? "The two spellings do not match."
    : null;

  const send = async () => {
    if (problem || sending) return;
    setSending(true);
    try {
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          "form-name": "word-suggestion",
          word: clean,
          length: String(clean.length),
          note,
        }).toString(),
      });
      // fetch only rejects on a network failure — a 404 resolves perfectly
      // happily. Without this check the card would thank someone for a word
      // that went nowhere, which is worse than telling them it failed.
      if (!res.ok) throw new Error(`form endpoint returned ${res.status}`);
      setSent(true);
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  };

  if (failed) {
    return (
      <Modal onClose={onClose}>
        <h2>Didn&rsquo;t send</h2>
        <p style={{ textAlign: "center" }}>
          <strong>{clean.toUpperCase()}</strong> could not be delivered — the suggestion box
          isn&rsquo;t accepting words right now. Nothing was lost; try again later, or pass it
          on the old-fashioned way.
        </p>
        <button className="nub-btn nub-btn--outline wd-suggest" onClick={() => setFailed(false)}>
          Back
        </button>
      </Modal>
    );
  }

  if (sent) {
    return (
      <Modal onClose={onClose}>
        <h2>Got it</h2>
        <p style={{ textAlign: "center" }}>
          <strong>{clean.toUpperCase()}</strong> is in the pile. If it makes the cut it will turn
          up as somebody&rsquo;s puzzle.
        </p>
        <button className="nub-btn nub-btn--go wd-suggest" onClick={onClose}>Done</button>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose}>
      <h2>Suggest a word</h2>
      <p>A word for a future puzzle. Five to ten letters, and one everyone would know.</p>
      <label className="wd-field">
        <span>The word</span>
        <input
          className="wd-input" value={word} autoFocus autoCapitalize="none"
          autoCorrect="off" spellCheck="false" maxLength={MAX_LENGTH}
          onChange={(e) => setWord(e.target.value)}
        />
      </label>
      <label className="wd-field">
        <span>Type it again</span>
        <input
          className="wd-input" value={again} autoCapitalize="none"
          autoCorrect="off" spellCheck="false" maxLength={MAX_LENGTH}
          onChange={(e) => setAgain(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
        />
      </label>
      <label className="wd-field">
        <span>Anything to add? <em>(optional)</em></span>
        <input
          className="wd-input" value={note} maxLength={120}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      {/* Only complain once they have typed enough for the complaint to be fair. */}
      <div className="wd-problem">{word && again ? problem : "\u00a0"}</div>
      <button className="nub-btn nub-btn--go wd-suggest" onClick={send} disabled={!!problem || sending}>
        {sending ? "Sending…" : "Send it in"}
      </button>
    </Modal>
  );
}

function StatsModal({ stats, status, guesses, answer, day, settings, onClose, toast }) {
  const [left, setLeft] = useState(msUntilTomorrow());
  useEffect(() => {
    const id = setInterval(() => setLeft(msUntilTomorrow()), 1000);
    return () => clearInterval(id);
  }, []);

  const over = status !== "playing";
  /* Everyone gets the new word at midnight in Belgium, which for a player
     anywhere else lands in the middle of their afternoon. Unexplained, that
     countdown just looks wrong, so it says whose midnight it is — and, when
     they are not in it, what time that works out to where they are. */
  const elsewhere = !inBelgianTime();
  const most = Math.max(1, ...stats.dist);
  const winPct = stats.played ? Math.round((stats.wins / stats.played) * 100) : 0;

  const share = async () => {
    const text = shareText({
      dayNumber: day, guesses, answer, won: status === "won",
      // The board is dark whatever the settings, so the share must be too.
      hardMode: settings.hardMode, darkTheme: true, highContrast: settings.contrast,
    });
    // Phones get the real share sheet; everything else falls back to the
    // clipboard, and only claims a copy that actually happened.
    if (navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
      try { await navigator.share({ text }); return; } catch { /* dismissed — fall through */ }
    }
    toast(await copyText(text) ? "Copied results to clipboard" : "Could not copy");
  };

  return (
    <Modal onClose={onClose}>
      {status === "lost" && <div className="wd-answer">The word was<strong>{answer}</strong></div>}
      <h2>Statistics</h2>
      <div className="wd-stats">
        <div className="wd-stat"><div className="wd-stat__n">{stats.played}</div><div className="wd-stat__label">Played</div></div>
        <div className="wd-stat"><div className="wd-stat__n">{winPct}</div><div className="wd-stat__label">Win %</div></div>
        <div className="wd-stat"><div className="wd-stat__n">{stats.streak}</div><div className="wd-stat__label">Current Streak</div></div>
        <div className="wd-stat"><div className="wd-stat__n">{stats.maxStreak}</div><div className="wd-stat__label">Max Streak</div></div>
      </div>
      <h2>Guess Distribution</h2>
      {stats.played === 0 ? (
        <p style={{ textAlign: "center" }}>No data</p>
      ) : (
        <div className="wd-dist">
          {stats.dist.map((n, i) => (
            <div className="wd-dist__row" key={i}>
              <div className="wd-dist__n">{i + 1}</div>
              <div
                className={`wd-dist__bar${status === "won" && guesses.length === i + 1 ? " wd-dist__bar--current" : ""}`}
                style={{ width: `${(n / most) * 100}%` }}
              >
                {n}
              </div>
            </div>
          ))}
        </div>
      )}
      {over && (
        <>
          <hr />
          <div className="wd-share">
            <div className="wd-share__col">
              <div className="wd-share__label">Next WordNUB</div>
              <div className="wd-countdown">{formatCountdown(left)}</div>
              <div className="wd-rollover">
                midnight in Belgium
                {elsewhere && <><br />{rolloverLocalTime()} here</>}
              </div>
            </div>
            <div className="wd-share__col">
              <button className="nub-btn nub-btn--go wd-sharebtn" onClick={share}>Share <Icon name="share" /></button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
