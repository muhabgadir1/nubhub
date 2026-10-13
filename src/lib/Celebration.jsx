import React, { useMemo, useState } from "react";
import "./celebration.css";

/**
 * Winning it — RummiNUB's celebration, on the other two games.
 *
 * A flutter of kisses and "Bisous!" across the whole page, and the result
 * floating straight over the board: no card, no panel. The board stays visible
 * underneath, because the first thing anyone wants after a game is to look at
 * how it ended. Tapping anywhere tucks the result into a pill at the top so it
 * can be looked at properly, and the way back to the stats goes with it.
 */

/** One flake of confetti — either a kiss or the word, at some angle. */
function makeFlakes(count) {
  const flakes = [];
  for (let i = 0; i < count; i++) {
    // Deterministic-ish spread: every column of the screen gets some.
    const left = ((i * 23) % 100) + (Math.random() * 6 - 3);
    const word = i % 3 === 1;
    flakes.push({
      id: i,
      word,
      left: Math.min(97, Math.max(1, left)),
      tilt: [-32, -18, -7, 0, 8, 21, 37][i % 7] + (Math.random() * 10 - 5),
      spin: (i % 2 ? 1 : -1) * (18 + Math.random() * 26),
      // Negative delays start most of them already falling, so the screen is
      // full from the first frame instead of filling up over five seconds.
      delay: -Math.random() * 7,
      duration: 4.6 + Math.random() * 4.2,
      drift: (Math.random() * 2 - 1) * 90,
      scale: word ? 0.72 + Math.random() * 0.5 : 0.8 + Math.random() * 0.9,
    });
  }
  return flakes;
}

export function KissFlutter({ count = 130 }) {
  const flakes = useMemo(() => makeFlakes(count), [count]);
  return (
    <div className="nub-flutter" aria-hidden="true">
      {flakes.map((f) => (
        <span
          key={f.id}
          className={`nub-flake${f.word ? " nub-flake--word" : ""}`}
          style={{
            left: `${f.left}%`,
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.duration}s`,
            "--tilt": `${f.tilt}deg`,
            "--spin": `${f.spin}deg`,
            "--drift": `${f.drift}px`,
            "--scale": f.scale,
          }}
        >
          {f.word ? "Bisous!" : "💋"}
        </span>
      ))}
    </div>
  );
}

/**
 * @param headline  the big shout — "Bisous!", "Genius", "Perfect!"
 * @param sub       one quiet line under it
 * @param onStats   opens the statistics card
 */
export default function Celebration({ headline, sub, onStats }) {
  const [minimised, setMinimised] = useState(false);

  if (minimised) {
    return (
      <>
        {/* Thinned out rather than stopped — the party is still going on
            somewhere behind the board you asked to look at. */}
        <KissFlutter count={45} />
        <div className="nub-win nub-win--min">
          <span className="nub-win__minname">{headline}</span>
          <button className="nub-win__btn nub-win__btn--go" onClick={onStats}>Stats</button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Shadowed, not covered: the board reads through it. */}
      <div className="nub-win__shade" onClick={() => setMinimised(true)} aria-hidden="true" />
      <KissFlutter />
      <div className="nub-win">
        <div className="nub-win__headline">{headline}</div>
        {sub && <div className="nub-win__sub">{sub}</div>}
        <div className="nub-win__row">
          <button className="nub-win__btn nub-win__btn--go" onClick={onStats}>See stats</button>
          <button className="nub-win__btn" onClick={() => setMinimised(true)}>See the board</button>
        </div>
      </div>
    </>
  );
}
