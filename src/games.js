/**
 * Everything NUBHUB links to.
 *
 * ⚠️ RUMMINUB_URL is the one value here that has to be checked by hand.
 * RummiNUB is a separate deployment with its own Netlify site and its own
 * Supabase project — it is not built or served from this repo, and nothing in
 * this repo can verify the address. If the card on the hub 404s, this line is
 * why. Change it to whatever `netlify open --site` prints for that project.
 */
export const RUMMINUB_URL = "https://rumminub.netlify.app";

export const GAMES = [
  {
    id: "rumminub",
    name: "RummiNUB",
    tagline: "Rummikub for two to four, with Khaltu Marwa's rules",
    blurb: "Tiles, runs and groups, in real time across phones. Make a room, send the code, play.",
    href: RUMMINUB_URL,
    external: true,
    art: "tiles",
  },
  {
    id: "wordnub",
    name: "WordNUB",
    tagline: "Guess the five-letter word in six tries",
    blurb: "One word a day. Green is right, yellow is close, grey is gone. Everyone gets the same word.",
    href: "/wordle",
    external: false,
    art: "letters",
  },
  {
    id: "connectnub",
    name: "ConnectNUB",
    tagline: "Find the four groups of four",
    blurb: "Sixteen words, four hidden categories, four mistakes. The trap is the words that fit twice.",
    href: "/connections",
    external: false,
    art: "grid",
  },
  {
    id: "mathnub",
    name: "MathNUB",
    tagline: "Climb from Grade 2 to calculus",
    blurb: "Twelve questions, one per school year. Three tries each. Miss all three and the climb stops there.",
    href: "/math",
    external: false,
    art: "rungs",
  },
];
