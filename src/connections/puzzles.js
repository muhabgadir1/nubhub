/**
 * The daily boards.
 *
 * `level` is the difficulty colour: 0 yellow, 1 green, 2 blue, 3 purple —
 * straightforward to devious, in that order.
 *
 * Every board is written to the same rule the game it copies lives by: the
 * hard part is never the vocabulary, it is that words belong to categories
 * they are not in. NAVY sits under shades of blue while the beans are
 * elsewhere; SPELL is a stretch of work, not magic. A board where each word
 * only ever fits one group is a word list, not a puzzle.
 *
 * Order is fixed. Append new boards at the END, or every past puzzle number
 * shifts under everyone who already played it.
 */
import { categoryKind } from "./logic.js";

export const PUZZLES = [
  [
    { level: 0, name: "SHADES OF BLUE", words: ["NAVY", "ROYAL", "BABY", "SKY"] },
    { level: 1, name: "BEANS", words: ["KIDNEY", "BLACK", "FAVA", "RUNNER"] },
    { level: 2, name: "NATO ALPHABET", words: ["LIMA", "ROMEO", "TANGO", "VICTOR"] },
    { level: 3, name: "DROP THE FIRST LETTER FOR AN ANIMAL", words: ["SCAT", "BRAT", "HOWL", "PANT"] },
  ],
  [
    { level: 0, name: "PARTS OF A SHOE", words: ["LACE", "TONGUE", "HEEL", "INSOLE"] },
    { level: 1, name: "FRESHWATER FISH", words: ["BASS", "PIKE", "PERCH", "TROUT"] },
    { level: 2, name: "PARTS OF A GUITAR", words: ["BRIDGE", "NECK", "FRET", "PICK"] },
    { level: 3, name: "SOUND LIKE GREEK LETTERS", words: ["PIE", "MEW", "ROW", "KEY"] },
  ],
  [
    { level: 0, name: "CASUAL GREETINGS", words: ["HI", "YO", "HEY", "SUP"] },
    { level: 1, name: "KINDS OF WAVE", words: ["SOUND", "HEAT", "BRAIN", "CROWD"] },
    { level: 2, name: "___ BOARD", words: ["KEY", "SURF", "CARD", "DASH"] },
    { level: 3, name: "BODY PARTS HIDDEN INSIDE", words: ["SHINE", "CHARMS", "SLIPS", "BEARD"] },
  ],
  [
    { level: 0, name: "BREAKFAST FOODS", words: ["BACON", "CEREAL", "OMELET", "GRITS"] },
    { level: 1, name: "THINGS YOU RAISE", words: ["GLASS", "CHILD", "EYEBROW", "ALARM"] },
    { level: 2, name: "BE EVASIVE", words: ["HEDGE", "STALL", "DODGE", "WAFFLE"] },
    { level: 3, name: "HORSE ___", words: ["PLAY", "SHOE", "RADISH", "POWER"] },
  ],
  [
    { level: 0, name: "CARD GAMES", words: ["BRIDGE", "HEARTS", "SPADES", "RUMMY"] },
    { level: 1, name: "THINGS WITH TEETH", words: ["COMB", "SAW", "ZIPPER", "GEAR"] },
    { level: 2, name: "DANCES", words: ["TAP", "SWING", "WALTZ", "SALSA"] },
    { level: 3, name: "___ BAND", words: ["RUBBER", "BROAD", "HEAD", "WRIST"] },
  ],
  [
    { level: 0, name: "PIZZA TOPPINGS", words: ["ONION", "PEPPER", "SAUSAGE", "ANCHOVY"] },
    { level: 1, name: "SHADES OF GREEN", words: ["OLIVE", "LIME", "SAGE", "MOSS"] },
    { level: 2, name: "HERBS", words: ["BASIL", "THYME", "OREGANO", "ROSEMARY"] },
    { level: 3, name: "___ LIGHT", words: ["MOON", "SPOT", "HIGH", "FLASH"] },
  ],
  [
    { level: 0, name: "PLAYING CARD RANKS", words: ["ACE", "KING", "QUEEN", "JACK"] },
    { level: 1, name: "BATMAN VILLAINS", words: ["JOKER", "PENGUIN", "RIDDLER", "BANE"] },
    { level: 2, name: "ONE-NAME SINGERS", words: ["ADELE", "PRINCE", "SEAL", "LORDE"] },
    { level: 3, name: "ANIMALS HIDDEN INSIDE", words: ["SCOWL", "BRATS", "SPIGOT", "CHEWED"] },
  ],
  [
    { level: 0, name: "STICKY THINGS", words: ["GLUE", "TAPE", "SYRUP", "RESIN"] },
    { level: 1, name: "TERMS OF ENDEARMENT", words: ["HONEY", "SUGAR", "PUMPKIN", "DEAR"] },
    { level: 2, name: "SMALL RECIPE AMOUNTS", words: ["DASH", "PINCH", "SPLASH", "SPRINKLE"] },
    { level: 3, name: "___ COOKIE", words: ["FORTUNE", "GINGER", "TOUGH", "OATMEAL"] },
  ],
  [
    { level: 0, name: "SHADES OF RED", words: ["CRIMSON", "SCARLET", "CHERRY", "MAROON"] },
    { level: 1, name: "GEMSTONES", words: ["OPAL", "JADE", "PEARL", "TOPAZ"] },
    { level: 2, name: "WAYS TO COOK AN EGG", words: ["POACH", "SCRAMBLE", "FRY", "BOIL"] },
    { level: 3, name: "___ JACK", words: ["LUMBER", "HI", "CRACKER", "FLAP"] },
  ],
  [
    { level: 0, name: "KEYBOARD KEYS", words: ["SHIFT", "TAB", "ENTER", "SPACE"] },
    { level: 1, name: "FINGERS", words: ["RING", "PINKY", "THUMB", "MIDDLE"] },
    { level: 2, name: "A STRETCH OF WORK", words: ["STINT", "TOUR", "TERM", "SPELL"] },
    { level: 3, name: "SILENT FIRST LETTER", words: ["KNEE", "GNOME", "WRIST", "PSALM"] },
  ],
  [
    { level: 0, name: "DOG BREEDS", words: ["BOXER", "PUG", "BEAGLE", "POODLE"] },
    { level: 1, name: "FLAT THINGS", words: ["PANCAKE", "BOARD", "PLAIN", "TIRE"] },
    { level: 2, name: "WORN OUT", words: ["BEAT", "SPENT", "WIPED", "DRAINED"] },
    { level: 3, name: "___ STICK", words: ["CHOP", "LIP", "YARD", "DRUM"] },
  ],
  [
    { level: 0, name: "CITRUS FRUITS", words: ["LEMON", "LIME", "ORANGE", "GRAPEFRUIT"] },
    { level: 1, name: "MOVIE GENRES", words: ["HORROR", "WESTERN", "THRILLER", "ROMANCE"] },
    { level: 2, name: "DRY ___", words: ["HUMOR", "WINE", "SPELL", "CLEAN"] },
    { level: 3, name: "SOUND LIKE LETTERS", words: ["BEE", "SEA", "WHY", "QUEUE"] },
  ],
  [
    { level: 0, name: "SEEN IN THE SKY", words: ["CLOUD", "STAR", "MOON", "PLANE"] },
    { level: 1, name: "DIETS", words: ["KETO", "VEGAN", "PALEO", "ATKINS"] },
    { level: 2, name: "WAYS TO COOK A POTATO", words: ["MASH", "ROAST", "FRY", "BAKE"] },
    { level: 3, name: "ADD AN S TO GET A NEW WORD", words: ["PARK", "HOP", "TALL", "WORD"] },
  ],
  [
    { level: 0, name: "BOARD GAMES", words: ["CLUE", "RISK", "SORRY", "TROUBLE"] },
    { level: 1, name: "SOUPS", words: ["MISO", "PHO", "GUMBO", "CHOWDER"] },
    { level: 2, name: "PASTA SHAPES", words: ["PENNE", "SHELL", "BOWTIE", "ZITI"] },
    { level: 3, name: "___ WATER", words: ["FIRE", "SALT", "FRESH", "UNDER"] },
  ],
  [
    { level: 0, name: "FALLS FROM THE SKY", words: ["RAIN", "SNOW", "HAIL", "SLEET"] },
    { level: 1, name: "SEVEN DWARFS", words: ["DOC", "HAPPY", "SNEEZY", "DOPEY"] },
    { level: 2, name: "PARTS OF A CASTLE", words: ["MOAT", "TOWER", "KEEP", "GATE"] },
    { level: 3, name: "ANAGRAMS OF ANIMALS", words: ["SHORE", "BARE", "FLOW", "SNEAK"] },
  ],
  [
    { level: 0, name: "WORN ON THE HEAD", words: ["CAP", "CROWN", "HELMET", "VISOR"] },
    { level: 1, name: "CLOUD TYPES", words: ["CIRRUS", "CUMULUS", "STRATUS", "NIMBUS"] },
    { level: 2, name: "TEAS", words: ["CHAI", "OOLONG", "MATCHA", "CHAMOMILE"] },
    { level: 3, name: "___ HOUSE", words: ["LIGHT", "GREEN", "FULL", "OUT"] },
  ],
  [
    { level: 0, name: "PARTS OF A CAR", words: ["TRUNK", "HOOD", "BUMPER", "FENDER"] },
    { level: 1, name: "SEEN ON A FOREST FLOOR", words: ["FERN", "BRAMBLE", "THICKET", "CANOPY"] },
    { level: 2, name: "KNOTS", words: ["BOWLINE", "HITCH", "SLIP", "SQUARE"] },
    { level: 3, name: "SOUND LIKE NUMBERS", words: ["WON", "TOO", "FOR", "ATE"] },
  ],
  [
    { level: 0, name: "SEA CREATURES", words: ["WHALE", "SQUID", "CRAB", "EEL"] },
    { level: 1, name: "CIRCUS PERFORMERS", words: ["CLOWN", "JUGGLER", "ACROBAT", "RINGMASTER"] },
    { level: 2, name: "APPLE VARIETIES", words: ["GALA", "FUJI", "EMPIRE", "JAZZ"] },
    { level: 3, name: "___ PROOF", words: ["FOOL", "BULLET", "CHILD", "SOUND"] },
  ],
  [
    { level: 0, name: "THINGS WITH KEYS", words: ["PIANO", "LOCK", "MAP", "TYPEWRITER"] },
    { level: 1, name: "THINGS TO SIT ON", words: ["STOOL", "BENCH", "PEW", "COUCH"] },
    { level: 2, name: "WAYS TO WALK", words: ["STROLL", "AMBLE", "SAUNTER", "TRUDGE"] },
    { level: 3, name: "PALINDROMES", words: ["LEVEL", "KAYAK", "RACECAR", "ROTOR"] },
  ],
  [
    { level: 0, name: "SPICY THINGS", words: ["CHILI", "WASABI", "GINGER", "PEPPER"] },
    { level: 1, name: "KINDS OF ROLL", words: ["DRUM", "BARREL", "EGG", "KAISER"] },
    { level: 2, name: "BRIDGE TYPES", words: ["ARCH", "SUSPENSION", "TRUSS", "DRAW"] },
    { level: 3, name: "INSTRUMENTS HIDDEN INSIDE", words: ["CELLOPHANE", "HARPOON", "VIOLATE", "ORGANIC"] },
  ],
  [
    { level: 0, name: "THINGS THAT FLOAT", words: ["RAFT", "BUOY", "CORK", "BALLOON"] },
    { level: 1, name: "PASTRIES", words: ["ECLAIR", "DANISH", "CROISSANT", "STRUDEL"] },
    { level: 2, name: "FOUND IN A DESERT", words: ["DUNE", "CACTUS", "OASIS", "MIRAGE"] },
    { level: 3, name: "___ CAKE", words: ["CUP", "PAN", "FRUIT", "BEEF"] },
  ],
  [
    { level: 0, name: "TYPES OF PANTS", words: ["JEANS", "SLACKS", "CHINOS", "CARGO"] },
    { level: 1, name: "SHADES OF BROWN", words: ["TAN", "SEPIA", "UMBER", "TAUPE"] },
    { level: 2, name: "PARTS OF AN EGG", words: ["YOLK", "WHITE", "MEMBRANE", "AIRCELL"] },
    { level: 3, name: "TYPED ON THE TOP ROW ONLY", words: ["TYPEWRITER", "POTTERY", "QUIET", "PERPETUITY"] },
  ],
  [
    { level: 0, name: "SEEN IN A HOSPITAL", words: ["GURNEY", "SCRUBS", "WARD", "CHART"] },
    { level: 1, name: "THINGS YOU CLIMB", words: ["LADDER", "STAIRS", "TREE", "MOUNTAIN"] },
    { level: 2, name: "SANDWICHES", words: ["REUBEN", "CLUB", "WRAP", "HERO"] },
    { level: 3, name: "SUPER ___", words: ["MARKET", "NOVA", "GLUE", "POWER"] },
  ],
  [
    { level: 0, name: "PARTS OF A FLOWER", words: ["PETAL", "STEM", "ROOT", "BUD"] },
    { level: 1, name: "SEEN ON A BAR", words: ["PINT", "TAP", "TAB", "COASTER"] },
    { level: 2, name: "SMALL", words: ["PETITE", "WEE", "MINUTE", "SLIGHT"] },
    { level: 3, name: "SPELLED WITH ROMAN NUMERALS ONLY", words: ["MIX", "DILL", "LIVID", "CIVIC"] },
  ],
  [
    { level: 0, name: "BIG CATS", words: ["LION", "TIGER", "JAGUAR", "PANTHER"] },
    { level: 1, name: "KINDS OF PALM", words: ["DATE", "COCONUT", "SAGO", "FAN"] },
    { level: 2, name: "OPEN ___", words: ["BAR", "MIC", "HOUSE", "SEASON"] },
    { level: 3, name: "___ CASE", words: ["BRIEF", "SUIT", "STAIR", "BOOK"] },
  ],
  [
    { level: 0, name: "KITCHEN APPLIANCES", words: ["BLENDER", "TOASTER", "KETTLE", "MIXER"] },
    { level: 1, name: "SCOTTISH THINGS", words: ["KILT", "LOCH", "HAGGIS", "BAGPIPE"] },
    { level: 2, name: "WAYS TO MAKE COFFEE", words: ["DRIP", "POUR", "PRESS", "ESPRESSO"] },
    { level: 3, name: "___ OVER", words: ["HANG", "LEFT", "PUSH", "TAKE"] },
  ],
  [
    { level: 0, name: "BOATS", words: ["CANOE", "FERRY", "DINGHY", "YACHT"] },
    { level: 1, name: "SEEN IN A PARADE", words: ["FLOAT", "BAND", "BATON", "CONFETTI"] },
    { level: 2, name: "STORMS", words: ["SQUALL", "GALE", "TEMPEST", "MONSOON"] },
    { level: 3, name: "COUNTRIES HIDDEN INSIDE", words: ["SCUBA", "MALICE", "PIRANHA", "ROMANCE"] },
  ],
  [
    { level: 0, name: "SEEN ON A DESK", words: ["LAMP", "STAPLER", "MONITOR", "MOUSE"] },
    { level: 1, name: "NUTS", words: ["PECAN", "CASHEW", "ALMOND", "WALNUT"] },
    { level: 2, name: "EXCELLENT", words: ["STELLAR", "SUPERB", "ACE", "PRIME"] },
    { level: 3, name: "SIDE ___", words: ["WALK", "KICK", "BURN", "SHOW"] },
  ],
  [
    { level: 0, name: "SEEN IN A GARDEN", words: ["HOSE", "TRELLIS", "SHED", "MULCH"] },
    { level: 1, name: "LETTUCES", words: ["ROMAINE", "ICEBERG", "BUTTER", "ARUGULA"] },
    { level: 2, name: "TIDY", words: ["NEAT", "TRIM", "ORDERLY", "SPRUCE"] },
    { level: 3, name: "___ WORM", words: ["EARTH", "BOOK", "SILK", "GLOW"] },
  ],
  [
    { level: 0, name: "PLANETS", words: ["MARS", "VENUS", "SATURN", "MERCURY"] },
    { level: 1, name: "TENNIS TERMS", words: ["LOVE", "DEUCE", "LET", "FAULT"] },
    { level: 2, name: "BLIND ___", words: ["SPOT", "ALLEY", "FAITH", "DATE"] },
    { level: 3, name: "GREEK COUNTERPARTS OF THE ABOVE", words: ["ARES", "APHRODITE", "CRONUS", "HERMES"] },
  ],
  [
    { level: 0, name: "SEEN IN A WALLET", words: ["CASH", "LICENSE", "RECEIPT", "PHOTO"] },
    { level: 1, name: "CHEESES", words: ["BRIE", "GOUDA", "FETA", "EDAM"] },
    { level: 2, name: "BROUGHT TO A PICNIC", words: ["BLANKET", "BASKET", "GRILL", "COOLER"] },
    { level: 3, name: "ANOTHER WORD BACKWARDS", words: ["DESSERTS", "STRAW", "DRAWER", "LOOTER"] },
  ],
  [
    { level: 0, name: "OLYMPIC SPORTS", words: ["FENCING", "ROWING", "ARCHERY", "DIVING"] },
    { level: 1, name: "PARTS OF THE HAND", words: ["PALM", "WRIST", "KNUCKLE", "CUTICLE"] },
    { level: 2, name: "THINGS THAT COME IN PAIRS", words: ["DICE", "SOCKS", "LUNGS", "CHOPSTICKS"] },
    { level: 3, name: "SAME SINGULAR AND PLURAL", words: ["SHEEP", "DEER", "FISH", "SERIES"] },
  ],
  [
    { level: 0, name: "SEEN IN A BATHROOM", words: ["TOWEL", "MIRROR", "SPONGE", "RAZOR"] },
    { level: 1, name: "THINGS THAT CAN BE SHARP", words: ["WIT", "CHEDDAR", "TURN", "PAIN"] },
    { level: 2, name: "___ CUT", words: ["HAIR", "SHORT", "CREW", "PAPER"] },
    { level: 3, name: "HOMOPHONES OF BODY PARTS", words: ["WASTE", "HARE", "HEAL", "NAVAL"] },
  ],
  [
    { level: 0, name: "PARTS OF A TREE", words: ["TRUNK", "BARK", "ROOT", "BRANCH"] },
    { level: 1, name: "KINDS OF SUGAR", words: ["BROWN", "CANE", "POWDERED", "RAW"] },
    { level: 2, name: "___ STORM", words: ["BRAIN", "SAND", "SNOW", "THUNDER"] },
    { level: 3, name: "DROP THE FIRST LETTER FOR A DRINK", words: ["DRUM", "SWINE", "SPORT", "GALE"] },
  ],
  [
    { level: 0, name: "BREEDS OF CAT", words: ["SIAMESE", "PERSIAN", "SPHYNX", "BENGAL"] },
    { level: 1, name: "SPICES", words: ["CUMIN", "PAPRIKA", "SAFFRON", "CLOVE"] },
    { level: 2, name: "PARTS OF A CLOCK", words: ["HAND", "FACE", "DIAL", "SPRING"] },
    { level: 3, name: "SPELLED WITH ONLY MUSICAL NOTES", words: ["CABBAGE", "FACADE", "BADGE", "DECADE"] },
  ],
  [
    { level: 0, name: "WINTER GEAR", words: ["SCARF", "MITTENS", "PARKA", "BOOTS"] },
    { level: 1, name: "THINGS THAT MELT", words: ["BUTTER", "SNOW", "WAX", "ICE"] },
    { level: 2, name: "KINDS OF POLISH", words: ["NAIL", "SHOE", "FRENCH", "SPIT"] },
    { level: 3, name: "DROP THE FIRST LETTER FOR A BODY PART", words: ["BEAR", "SHIP", "SLIP", "HARM"] },
  ],
  [
    // Tiles do not have to be words. Four of these are punctuation doing a job
    // that has nothing to do with punctuation.
    { level: 0, name: "MATH OPERATORS", words: ["\u2212", "\u00d7", "\u00f7", "\u221a"] },
    { level: 1, name: "ENDS A SENTENCE", words: [".", "?", "!", "\u2026"] },
    { level: 2, name: "SHIFT PLUS A NUMBER KEY", words: ["@", "#", "%", "^"] },
    { level: 3, kind: "wordplay", name: "EMOTICON EYES", words: [":", ";", "8", "X"] },
  ],
  [
    { level: 0, name: "FARM ANIMALS", words: ["HORSE", "SHEEP", "GOAT", "DUCK"] },
    { level: 1, name: "SOUNDS A CROWD MAKES", words: ["CHEER", "BOO", "ROAR", "GASP"] },
    { level: 2, name: "BRAVE", words: ["BOLD", "GUTSY", "PLUCKY", "VALIANT"] },
    { level: 3, name: "ANIMALS PLUS A LETTER", words: ["BEARD", "COWL", "RATE", "FOXY"] },
  ],
  [
    { level: 0, name: "SHADES OF PINK", words: ["ROSE", "BLUSH", "SALMON", "CORAL"] },
    { level: 1, name: "THINGS THAT STING", words: ["WASP", "NETTLE", "JELLYFISH", "BEE"] },
    { level: 2, name: "QUICKLY", words: ["FAST", "APACE", "PRONTO", "SWIFTLY"] },
    { level: 3, name: "DROP THE LAST LETTER FOR A COLOUR", words: ["REDO", "TANK", "PINKY", "JADED"] },
  ],
  [
    { level: 0, name: "ROOMS IN A HOUSE", words: ["KITCHEN", "ATTIC", "PANTRY", "STUDY"] },
    { level: 1, name: "THINGS YOU BREW", words: ["TEA", "COFFEE", "BEER", "TROUBLE"] },
    { level: 2, name: "EXAMINE", words: ["PROBE", "INSPECT", "SURVEY", "SCAN"] },
    { level: 3, name: "RHYME WITH A BODY PART", words: ["TREE", "GRIN", "CHEER", "WHIP"] },
  ],
  [
    { level: 0, name: "BAKING SUPPLIES", words: ["FLOUR", "YEAST", "VANILLA", "COCOA"] },
    { level: 1, name: "THINGS THAT ARE ROUND", words: ["WHEEL", "COIN", "GLOBE", "DIAL"] },
    { level: 2, name: "BRITISH SLANG", words: ["CHUFFED", "GUTTED", "KNACKERED", "PECKISH"] },
    { level: 3, name: "FRUIT WITH ONE LETTER CHANGED", words: ["GRAPH", "MANGA", "PEACE", "LIMB"] },
  ],
  [
    { level: 0, name: "TOOLS", words: ["HAMMER", "WRENCH", "CHISEL", "PLIERS"] },
    { level: 1, name: "PARTS OF A BICYCLE", words: ["PEDAL", "SPOKE", "CHAIN", "SADDLE"] },
    { level: 2, name: "THINGS THAT CAN BE BROKEN", words: ["RECORD", "PROMISE", "SILENCE", "HEART"] },
    { level: 3, name: "ANIMALS SPELLED BACKWARD", words: ["STAR", "GOD", "TAB", "REED"] },
  ],
  [
    { level: 0, name: "SEEN AT A WEDDING", words: ["VEIL", "BOUQUET", "TOAST", "CONFETTI"] },
    { level: 1, name: "THINGS THAT CAN BE SPARKLING", words: ["WATER", "WINE", "EYES", "WIT"] },
    { level: 2, name: "LATIN AMERICAN DANCES", words: ["SAMBA", "TANGO", "RUMBA", "MAMBO"] },
    { level: 3, name: "THANK YOU IN OTHER LANGUAGES", words: ["MERCI", "GRACIAS", "DANKE", "ARIGATO"] },
  ],
  [
    { level: 0, name: "PARTS OF A DAY", words: ["DAWN", "NOON", "DUSK", "MIDNIGHT"] },
    { level: 1, name: "THINGS YOU CAN CATCH", words: ["COLD", "BUS", "BALL", "GLIMPSE"] },
    { level: 2, name: "SECRET", words: ["COVERT", "HUSH", "INSIDE", "PRIVATE"] },
    { level: 3, name: "UNDER ___", words: ["WEAR", "DOG", "GROUND", "STUDY"] },
  ],
  [
    // Tiles can be more than one word, too.
    { level: 0, name: "IN A KITCHEN DRAWER", words: ["WHISK", "SPATULA", "LADLE", "PEELER"] },
    { level: 1, name: "RECTANGULAR THINGS", words: ["BRICK", "DOOR", "FLAG", "SCREEN"] },
    { level: 2, name: "IN A TOOLBOX", words: ["TAPE MEASURE", "SPIRIT LEVEL", "ALLEN KEY", "DUCT TAPE"] },
    { level: 3, name: "___ BOX", words: ["SAND", "TOOL", "JUKE", "LUNCH"] },
  ],
  [
    { level: 0, name: "WORN ON THE FEET", words: ["SOCKS", "SANDALS", "BOOTS", "CLOGS"] },
    { level: 1, name: "THINGS THAT DRIP", words: ["TAP", "CANDLE", "ICICLE", "FAUCET"] },
    { level: 2, name: "TYPES OF POEM", words: ["SONNET", "HAIKU", "ODE", "LIMERICK"] },
    { level: 3, name: "HOMOPHONES OF TREES", words: ["BEACH", "FUR", "YOU", "SEEDER"] },
  ],
  [
    { level: 0, name: "PACKED IN A SUITCASE", words: ["CLOTHES", "PASSPORT", "CHARGER", "TOOTHBRUSH"] },
    { level: 1, name: "SLEEP", words: ["NAP", "DOZE", "SNOOZE", "KIP"] },
    { level: 2, name: "CRICKET TERMS", words: ["WICKET", "OVER", "INNINGS", "DUCK"] },
    { level: 3, name: "SILENT B", words: ["THUMB", "LAMB", "DEBT", "COMB"] },
  ],
  [
    { level: 0, name: "IN A FIRST AID KIT", words: ["BANDAGE", "GAUZE", "TWEEZERS", "PLASTERS"] },
    { level: 1, name: "CALM", words: ["SERENE", "PLACID", "TRANQUIL", "STILL"] },
    { level: 2, name: "POKER TERMS", words: ["FOLD", "RAISE", "BLUFF", "RIVER"] },
    { level: 3, name: "___ HORSE", words: ["SEA", "DARK", "ROCKING", "CLOTHES"] },
  ],
];

/*
 * A board with a repeated word, a missing colour or five words in a group is
 * unplayable, and the day it comes up is the day everyone finds out. Checking
 * at import means a bad edit fails the build instead.
 */
PUZZLES.forEach((groups, i) => {
  const n = i + 1;
  if (groups.length !== 4) throw new Error(`puzzle ${n}: ${groups.length} groups, expected 4`);
  // Purple is the one with the trick in it. A board whose hardest group is a
  // plain list of things has no top end, however obscure the things are.
  const purple = groups.find((g) => g.level === 3);
  if (purple && categoryKind(purple.name, purple.kind) === "category") {
    throw new Error(`puzzle ${n}: purple "${purple.name}" is a plain category`);
  }
  const levels = new Set();
  const words = new Set();
  for (const g of groups) {
    if (g.words.length !== 4) throw new Error(`puzzle ${n}, "${g.name}": ${g.words.length} words`);
    levels.add(g.level);
    for (const w of g.words) {
      if (words.has(w)) throw new Error(`puzzle ${n}: "${w}" appears twice`);
      words.add(w);
    }
  }
  if (levels.size !== 4) throw new Error(`puzzle ${n}: levels are ${[...levels]}, expected 0-3`);
});
