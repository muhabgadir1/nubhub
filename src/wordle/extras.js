/**
 * Legal guesses the system dictionary has never heard of.
 *
 * /usr/share/dict/words is Webster's Second — it stops around 1934. It has no
 * "email", no "vibes", no "blogs", and the derivation rules in
 * scripts/build-words.mjs only reach inflections of words it *does* contain.
 * Anything a player would reasonably type and be annoyed to see rejected goes
 * here. These are guesses only; the solutions live in answers.js.
 */
export const EXTRA_GUESSES = [
  // Modern vocabulary the 1934 dictionary predates.
  "email", "blogs", "vlogs", "vibes", "vibed", "pixel", "inbox", "modem",
  "wifi", "cyber", "meme", "memes", "emoji", "avatar", "click", "clicks",
  "reset", "setup", "popup", "logon", "unzip", "app", "apps", "byte", "bytes",
  "cache", "cloud", "debug", "input", "login", "macro", "media", "pings",
  "pixie", "queue", "retro", "scans", "spams", "techy", "tweet", "typed",
  "types", "upload", "users", "video", "viral", "zoned", "phone", "photo",
  "texts", "texted", "vapes", "vaped", "selfie", "swipe", "swiped", "swipes",
  "uber", "wikis", "yikes", "yeets", "nerdy", "geeky", "hangs", "chats",

  // Food and everyday nouns that arrived after Webster.
  "pizza", "pasta", "tacos", "nacho", "salsa", "sushi", "curry", "kebab",
  "vegan", "mocha", "latte", "donut", "bagel", "chips", "fries", "soda",
  "cocoa", "juice", "snack", "candy", "cakes", "pizza", "wraps", "gyros",
  "boba", "ramen", "miso", "tofu", "kimchi", "quinoa", "hummus", "falafel",

  // Very common inflections the derivation rules cannot reach.
  "boxes", "foxes", "faxes", "mixes", "waxes", "taxes", "buses", "gases",
  "dishes", "wishes", "asked", "baked", "biked", "caked", "faked", "hiked",
  "joked", "liked", "poked", "raked", "woken", "spoke", "broke", "chose",
  "drove", "froze", "given", "taken", "eaten", "fallen", "risen", "shaken",
  "tries", "cries", "dries", "flies", "plies", "spies", "skies", "ties",
  "cited", "dined", "fined", "hired", "lined", "mined", "pined", "tired",
  "wired", "cured", "dared", "fired", "hared", "aired", "eased", "erased",

  // Words people reach for early because of their vowels and common letters.
  "adieu", "audio", "ouija", "aioli", "louie", "roate", "raise", "arise",
  "soare", "salet", "crate", "trace", "slate", "stare", "least", "irate",
  "cares", "tears", "rates", "notes", "tones", "stone", "snore", "roles",
  "lores", "cones", "dares", "hares", "mares", "pares", "wares", "bares",

  // Interjections and informal words that feel unfair to reject.
  "yeah", "nope", "yikes", "oomph", "aargh", "argh", "hmmm", "phew", "oops",
  "okay", "howdy", "hiya", "byes", "yay", "meh", "duh", "yup", "nah",
  "gonna", "wanna", "gotta", "kinda", "sorta", "dunno", "outta", "lotta",
  "goofy", "dorky", "kooky", "wacky", "zany", "spunk", "punky", "funky",
  "janky", "swank", "chill", "vibey", "moody", "salty", "sassy", "peppy",
];
