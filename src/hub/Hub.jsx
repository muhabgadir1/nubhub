import React from "react";
import { GAMES } from "../games";
import "./hub.css";

/* The three previews. Each is a miniature of the real game rather than an
   icon, so a card tells you what it is before you open it. */

function TilesArt() {
  const tiles = [
    { n: 7, colour: "#181818", tilt: -6 },
    { n: 8, colour: "#c8102e", tilt: 2 },
    { n: 9, colour: "#1e4fa8", tilt: -2 },
    { n: 10, colour: "#e27b0e", tilt: 6 },
  ];
  return tiles.map(({ n, colour, tilt }) => (
    <div key={n} className="hub-rtile" style={{ color: colour, "--tilt": `${tilt}deg` }}>{n}</div>
  ));
}

function LettersArt() {
  const row = [["N", "correct"], ["U", "absent"], ["B", "present"], ["B", "absent"], ["Y", "absent"]];
  return row.map(([ch, state], i) => (
    <div key={i} className={`hub-ltile hub-ltile--${state}`}>{ch}</div>
  ));
}

function GridArt() {
  const cells = [0, 0, 0, 0, 3, 3, 3, 3, null, null, null, null, null, null, null, null];
  return (
    <div className="hub-cgrid">
      {cells.map((level, i) => (
        <div key={i} className={`hub-ccell${level === null ? "" : ` hub-ccell--${level}`}`} />
      ))}
    </div>
  );
}

/* MathNUB: the rail, part-climbed. */
function RungsArt() {
  const dots = [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0]; // five rungs cleared
  return (
    <div className="hub-rail">
      {dots.map((done, i) => (
        <React.Fragment key={i}>
          <span className={`hub-rdot${done ? " hub-rdot--done" : ""}${i === 5 ? " hub-rdot--now" : ""}`} />
          {i < dots.length - 1 && <span className={`hub-rlink${done ? " hub-rlink--done" : ""}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

const ART = { tiles: TilesArt, letters: LettersArt, grid: GridArt, rungs: RungsArt };

export default function Hub({ navigate }) {
  return (
    <div className="hub nub-room">
      <header className="hub-head">
        <h1 className="hub-mark">NUB<span>HUB</span></h1>
        <div className="hub-sub">Four games · one a day, or all afternoon</div>
      </header>

      <div className="hub-grid">
        {GAMES.map((game) => {
          const Art = ART[game.art];
          /* Internal games route without a page load; RummiNUB is its own
             deployment, so that one is a plain link and leaves the site. */
          const props = game.external
            ? { href: game.href, target: "_blank", rel: "noopener noreferrer" }
            : { href: game.href, onClick: (e) => { e.preventDefault(); navigate(game.href); } };
          return (
            <a className="hub-card nub-card" key={game.id} {...props}>
              <div className={`hub-art hub-art--${game.art}`}><Art /></div>
              <div className="hub-body">
                <h2 className="hub-name">{game.name}</h2>
                <div className="hub-cardtag">{game.tagline}</div>
                <p className="hub-blurb">{game.blurb}</p>
                <span className="hub-play nub-btn nub-btn--go">Play</span>
              </div>
            </a>
          );
        })}
      </div>

      <footer className="hub-foot">Built for the NUBs. New puzzles every midnight.</footer>
    </div>
  );
}
