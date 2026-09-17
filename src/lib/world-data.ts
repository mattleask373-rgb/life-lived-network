/**
 * Demo data for the first Living World prototype.
 *
 * IMPORTANT: this is placeholder demo content for a single realistic city
 * (Lisbon). It is deliberately kept behind a small module boundary so it can be
 * replaced by a real data service (Supabase / API) without touching the UI.
 *
 * No AI-generated imagery is used anywhere. Entries carry no photographs; the
 * UI renders neutral, hand-made placeholders instead.
 */

export type LayerId =
  | "work"
  | "experience"
  | "music"
  | "art"
  | "community"
  | "people"
  | "nature"
  | "food";

export type TimeBand = "now" | "today" | "tonight" | "tomorrow" | "weekend";

export interface WorldEntry {
  id: string;
  layer: LayerId;
  title: string;
  /** Human place name, never an exact private address. */
  place: string;
  neighbourhood: string;
  /** Position on the stylised map, 0-100 in each axis. Approximate by design. */
  x: number;
  y: number;
  when: string;
  band: TimeBand;
  /** Minutes a person would realistically give to this. */
  minutes: number;
  /** Cost in euros. 0 means free. Negative means it pays. */
  cost: number;
  summary: string;
  /** Short, plainly-worded details. */
  details: string[];
  /** What a person could give here. */
  give?: string;
  /** Who posted it — a real host on the platform, not a brand voice. */
  host: string;
  verified: boolean;
  social: "quiet" | "friendly" | "lively";
  outdoors: boolean;
}

export interface Layer {
  id: LayerId;
  label: string;
  glyph: string;
  blurb: string;
}

export const LAYERS: Layer[] = [
  { id: "work", label: "Work", glyph: "🛠", blurb: "Paid hours, near you" },
  { id: "experience", label: "Experiences", glyph: "🧭", blurb: "Learn something real" },
  { id: "music", label: "Music", glyph: "🎵", blurb: "Rooms with sound in them" },
  { id: "art", label: "Artists", glyph: "🎨", blurb: "People making things" },
  { id: "community", label: "Community", glyph: "🤝", blurb: "Places that need hands" },
  { id: "people", label: "People", glyph: "👋", blurb: "Open to meeting someone" },
  { id: "nature", label: "Nature", glyph: "🌲", blurb: "Go outside" },
  { id: "food", label: "Food", glyph: "🥘", blurb: "Tables with room at them" },
];

export const PLACE = {
  name: "Lisbon",
  region: "Portugal",
  note: "A demo place, so you can feel how this works.",
};

export const ENTRIES: WorldEntry[] = [
  {
    id: "mercado-manha",
    layer: "food",
    title: "Morning market walk with Inês",
    place: "Mercado de Arroios",
    neighbourhood: "Arroios",
    x: 61,
    y: 38,
    when: "Every morning until 13:00",
    band: "now",
    minutes: 90,
    cost: 8,
    summary:
      "Inês shops here twice a week. She'll walk you round, introduce two stallholders and help you order in Portuguese.",
    details: [
      "Meet by the flower stall at the north entrance",
      "Small group, usually three or four people",
      "Bring a bag if you want to buy anything",
    ],
    give: "Carry a crate for Sr. Almeida — he's 74 and does it alone",
    host: "Inês, lives in Arroios",
    verified: true,
    social: "friendly",
    outdoors: false,
  },
  {
    id: "horta-graca",
    layer: "community",
    title: "The garden needs hands on Thursday",
    place: "Horta da Graça",
    neighbourhood: "Graça",
    x: 70,
    y: 30,
    when: "Thursday, 16:00 – 19:00",
    band: "today",
    minutes: 180,
    cost: 0,
    summary:
      "A neighbourhood garden built on an old car park. Beds need turning before the autumn planting.",
    details: [
      "No experience needed, tools are there",
      "Somebody usually cooks afterwards",
      "Children welcome",
    ],
    give: "Three hours of digging, or seeds if you have them",
    host: "Associação Horta da Graça",
    verified: true,
    social: "friendly",
    outdoors: true,
  },
  {
    id: "tasca-tuesday",
    layer: "music",
    title: "We have an empty Tuesday",
    place: "Tasca do Mário",
    neighbourhood: "Alfama",
    x: 74,
    y: 44,
    when: "Tuesday evening, from 21:00",
    band: "tonight",
    minutes: 150,
    cost: 0,
    summary:
      "Twelve tables, an upright piano that mostly works, and no one booked. Mário would rather have music than quiet.",
    details: [
      "Any instrument, any language",
      "No fee, but the kitchen feeds whoever plays",
      "Room holds about thirty people",
    ],
    give: "Play something. Or photograph whoever does.",
    host: "Mário, running the place since 1998",
    verified: true,
    social: "lively",
    outdoors: false,
  },
  {
    id: "fado-vadio",
    layer: "music",
    title: "Fado vadio — anyone can sing",
    place: "A small room behind a grocer",
    neighbourhood: "Mouraria",
    x: 68,
    y: 41,
    when: "Tonight, 22:00 onwards",
    band: "tonight",
    minutes: 120,
    cost: 6,
    summary:
      "Amateur fado. Locals stand up one by one. Visitors are welcome as long as they're quiet while someone sings.",
    details: [
      "Exact address shared once you say you're coming",
      "Cash only",
      "It gets going late",
    ],
    host: "Casa do Bairro collective",
    verified: false,
    social: "lively",
    outdoors: false,
  },
  {
    id: "clean-turnaround",
    layer: "work",
    title: "Two flats to turn around, paid same day",
    place: "Near Praça das Flores",
    neighbourhood: "Príncipe Real",
    x: 47,
    y: 47,
    when: "Tomorrow, 10:00 – 14:00",
    band: "tomorrow",
    minutes: 240,
    cost: -60,
    summary:
      "Guest changeover cleaning for two small apartments. Four hours, €60, paid on completion.",
    details: [
      "Products and linen provided",
      "Needs care, not experience",
      "Host has done 40 changeovers through the platform",
    ],
    host: "Teresa, manages four flats",
    verified: true,
    social: "quiet",
    outdoors: false,
  },
  {
    id: "kitchen-hands",
    layer: "work",
    title: "Kitchen hands for a busy weekend",
    place: "A family restaurant",
    neighbourhood: "Campo de Ourique",
    x: 33,
    y: 52,
    when: "Friday and Saturday evenings",
    band: "weekend",
    minutes: 300,
    cost: -140,
    summary:
      "Prep and wash for two evening services. €70 a shift, dinner included, cash at the end of each night.",
    details: [
      "Some Portuguese helps but isn't required",
      "Standing work, hot kitchen",
      "They've hired three travellers this way already",
    ],
    host: "Restaurante Bica — Cláudia",
    verified: true,
    social: "lively",
    outdoors: false,
  },
  {
    id: "photo-hands",
    layer: "work",
    title: "Photographer wanted for one evening",
    place: "Community hall",
    neighbourhood: "Marvila",
    x: 86,
    y: 34,
    when: "Saturday, 19:00 – 22:00",
    band: "weekend",
    minutes: 180,
    cost: -80,
    summary:
      "A neighbourhood association is launching its new space and wants honest photographs of it, not staged ones.",
    details: [
      "Bring your own camera",
      "You keep the rights, they get a licence to use them",
      "€80 and dinner",
    ],
    host: "Marvila Associação",
    verified: false,
    social: "friendly",
    outdoors: false,
  },
  {
    id: "surf-carcavelos",
    layer: "experience",
    title: "First time in the water",
    place: "Carcavelos beach",
    neighbourhood: "West of the city",
    x: 8,
    y: 66,
    when: "Most mornings, tide depending",
    band: "tomorrow",
    minutes: 180,
    cost: 25,
    summary:
      "Two hours with João, who has taught here for nine years. Board and wetsuit included.",
    details: [
      "Train from Cais do Sodré, about 25 minutes",
      "Bring a towel and water",
      "Cancelled honestly if the sea is wrong — no pretending",
    ],
    host: "João, Carcavelos",
    verified: true,
    social: "friendly",
    outdoors: true,
  },
  {
    id: "language-swap",
    layer: "people",
    title: "Portuguese for English, over coffee",
    place: "A café with a big table",
    neighbourhood: "Estrela",
    x: 36,
    y: 57,
    when: "Wednesdays, 18:30",
    band: "today",
    minutes: 90,
    cost: 3,
    summary:
      "Half an hour in each language, then people usually stay talking. Six or seven regulars, always room for more.",
    details: [
      "Any level, including absolute beginner",
      "You buy your own coffee",
      "No sign-up, just turn up",
    ],
    give: "Your own language, whatever it is",
    host: "Started by Rui and a Brazilian neighbour",
    verified: false,
    social: "friendly",
    outdoors: false,
  },
  {
    id: "open-table",
    layer: "food",
    title: "We're cooking tonight — room for two",
    place: "A shared kitchen",
    neighbourhood: "Anjos",
    x: 63,
    y: 34,
    when: "Tonight, 20:00",
    band: "tonight",
    minutes: 150,
    cost: 5,
    summary:
      "Four people cooking one big pot. Two chairs spare. Bring something for the table if you can.",
    details: [
      "Address shared after a short hello",
      "Vegetarian",
      "Ends when it ends",
    ],
    give: "Bread, wine, or the washing up",
    host: "Marta and her flatmates",
    verified: false,
    social: "friendly",
    outdoors: false,
  },
  {
    id: "studio-collab",
    layer: "art",
    title: "Looking for someone to build a set with",
    place: "A shared studio",
    neighbourhood: "Alcântara",
    x: 22,
    y: 62,
    when: "Ongoing, afternoons",
    band: "weekend",
    minutes: 240,
    cost: 0,
    summary:
      "A filmmaker and a carpenter are making a small stage set from salvaged wood and want a third pair of hands.",
    details: [
      "No money involved — shared credit and shared work",
      "Tools are there",
      "They meet most afternoons",
    ],
    give: "Hands, ideas, or a saw you're not using",
    host: "Pedro and Sofia",
    verified: false,
    social: "quiet",
    outdoors: false,
  },
  {
    id: "print-workshop",
    layer: "art",
    title: "Learn to print with a hand press",
    place: "A print studio above a garage",
    neighbourhood: "Intendente",
    x: 66,
    y: 36,
    when: "Saturday, 11:00 – 14:00",
    band: "weekend",
    minutes: 180,
    cost: 30,
    summary:
      "Six people, one old press, and you leave with what you made.",
    details: ["Materials included", "Taught in Portuguese and English", "Six places"],
    host: "Oficina de Cima",
    verified: true,
    social: "quiet",
    outdoors: false,
  },
  {
    id: "monsanto-walk",
    layer: "nature",
    title: "Walk into the forest from the city",
    place: "Monsanto",
    neighbourhood: "West",
    x: 15,
    y: 44,
    when: "Any daylight hours",
    band: "now",
    minutes: 150,
    cost: 0,
    summary:
      "Eight hundred hectares of pine and eucalyptus, reachable on foot from Campolide. Quiet on weekdays.",
    details: [
      "Marked paths, some steep",
      "Water fountain near the viewpoint",
      "Take the phone but you won't need it",
    ],
    host: "Route shared by a local walking group",
    verified: true,
    social: "quiet",
    outdoors: true,
  },
  {
    id: "river-clean",
    layer: "community",
    title: "River clean-up, then breakfast",
    place: "Doca do Poço do Bispo",
    neighbourhood: "Marvila",
    x: 90,
    y: 40,
    when: "Sunday, 09:00 – 11:00",
    band: "weekend",
    minutes: 120,
    cost: 0,
    summary:
      "Twenty-odd people, gloves and bags provided. Someone brings coffee in a flask.",
    details: ["Wear old shoes", "Two hours, no commitment after", "Kids come along"],
    give: "Two hours, and gloves if you have spares",
    host: "Limpar o Tejo",
    verified: true,
    social: "friendly",
    outdoors: true,
  },
  {
    id: "tejo-swim",
    layer: "nature",
    title: "Cold swim before work",
    place: "Praia dos Pescadores, Paço de Arcos",
    neighbourhood: "West of the city",
    x: 5,
    y: 60,
    when: "Weekdays, 07:15",
    band: "tomorrow",
    minutes: 60,
    cost: 0,
    summary:
      "Five or six people swim, then stand about drinking coffee. Nobody is trying to be impressive.",
    details: ["Bring a towel", "They wait until 07:25", "Not for weak swimmers"],
    host: "An informal group of neighbours",
    verified: false,
    social: "friendly",
    outdoors: true,
  },
  {
    id: "building-project",
    layer: "community",
    title: "Turning an empty building into a rehearsal space",
    place: "Rua da Palma, upper floors",
    neighbourhood: "Baixa",
    x: 58,
    y: 45,
    when: "Work parties every second Saturday",
    band: "weekend",
    minutes: 300,
    cost: 0,
    summary:
      "Musicians, a retired electrician and a neighbourhood association are clearing three rooms so local bands have somewhere to play.",
    details: [
      "Funding is being raised in the open — nothing hidden",
      "Skills wanted: wiring, plastering, admin, Portuguese paperwork",
      "Rooms will be free for local musicians",
    ],
    give: "A skill, an hour, tools, or money if you'd rather",
    host: "Sala Palma — a group of nine neighbours",
    verified: true,
    social: "friendly",
    outdoors: false,
  },
  {
    id: "someone-north",
    layer: "people",
    title: "Heading north on Friday, going the same way?",
    place: "Shared as a route, not a location",
    neighbourhood: "Lisbon → Porto → Galicia",
    x: 44,
    y: 27,
    when: "Leaving Friday",
    band: "weekend",
    minutes: 0,
    cost: 0,
    summary:
      "Someone has chosen to show their route. Your journeys overlap for three days.",
    details: [
      "Only the route is shared, never a live location",
      "Either of you can stop sharing at any moment",
      "No obligation to meet",
    ],
    host: "A traveller who opted in",
    verified: false,
    social: "quiet",
    outdoors: false,
  },
  {
    id: "local-open",
    layer: "people",
    title: "Happy to show someone around this week",
    place: "Meets in public places only",
    neighbourhood: "Alfama & Graça",
    x: 78,
    y: 38,
    when: "Evenings this week",
    band: "today",
    minutes: 120,
    cost: 0,
    summary:
      "Lived here eleven years. Enjoys walking and doesn't mind questions. Not a guide, not paid.",
    details: [
      "Public places, no exceptions",
      "You can message before agreeing to anything",
      "Speaks Portuguese, Spanish and some English",
    ],
    host: "A local who opted into being findable",
    verified: true,
    social: "friendly",
    outdoors: true,
  },
  {
    id: "one-hour-guitar",
    layer: "art",
    title: "I have one hour — I can teach you guitar",
    place: "A park bench, or wherever",
    neighbourhood: "Jardim da Estrela",
    x: 38,
    y: 53,
    when: "Most afternoons",
    band: "today",
    minutes: 60,
    cost: 0,
    summary:
      "One hour, free, first three chords. He'd like an hour of Portuguese cooking in return, but doesn't insist.",
    details: ["Bring a guitar or share his", "Outside if it's dry", "One hour, honestly one hour"],
    give: "An hour of something you know",
    host: "Nuno, plays in a covers band",
    verified: false,
    social: "quiet",
    outdoors: true,
  },
  {
    id: "cook-workshop",
    layer: "experience",
    title: "Cook what people actually eat here",
    place: "A home kitchen",
    neighbourhood: "Penha de França",
    x: 76,
    y: 30,
    when: "Thursday, 18:00",
    band: "today",
    minutes: 180,
    cost: 22,
    summary:
      "Not a tourist cooking class. Four dishes a Lisbon family eats on a normal week, then you all eat them.",
    details: ["Five places", "Vegetarian version possible", "Ingredients included"],
    host: "Dona Amélia and her granddaughter",
    verified: true,
    social: "friendly",
    outdoors: false,
  },
];

export function entriesByLayer(layers: LayerId[]): WorldEntry[] {
  if (layers.length === 0) return ENTRIES;
  return ENTRIES.filter((e) => layers.includes(e.layer));
}

export function entryById(id: string): WorldEntry | undefined {
  return ENTRIES.find((e) => e.id === id);
}

/** Real activity snapshot for the "Something's happening here" panel. */
export function activitySnapshot(): { layer: Layer; count: number }[] {
  return LAYERS.map((layer) => ({
    layer,
    count: ENTRIES.filter((e) => e.layer === layer.id).length,
  })).filter((row) => row.count > 0);
}

/** Things nearby that relate to a given entry, without any ranking magic. */
export function relatedEntries(entry: WorldEntry, limit = 3): WorldEntry[] {
  return ENTRIES.filter((e) => e.id !== entry.id)
    .map((e) => {
      const distance = Math.hypot(e.x - entry.x, e.y - entry.y);
      const sameArea = e.neighbourhood === entry.neighbourhood ? -20 : 0;
      const sameBand = e.band === entry.band ? -8 : 0;
      return { e, score: distance + sameArea + sameBand };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((r) => r.e);
}

export const LIFE_LIST_SEEDS = [
  "Learn to surf",
  "Play music with strangers",
  "Help restore an old building",
  "Sleep under the stars",
  "Cook for six people I've never met",
  "Learn enough Portuguese to be rude politely",
];
