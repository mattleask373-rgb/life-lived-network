import type { LayerId } from "./world-data";

/**
 * Topic landing pages are human-readable entry points into the existing map.
 * Their content describes a category, never local availability. The selected
 * layer is passed to the canonical map, which remains the sole discovery source.
 */
export interface ExploreTopic {
  slug: string;
  layer: LayerId;
  label: string;
  heading: string;
  description: string;
  introduction: string;
  goodFor: string[];
  nextStep: string;
  contribution: string;
}

export const EXPLORE_TOPICS: readonly ExploreTopic[] = [
  {
    slug: "work",
    layer: "work",
    label: "Work & opportunities",
    heading: "Find work that exists in the real world",
    description:
      "Explore paid hours, practical work and local opportunities recorded by people in the place you choose.",
    introduction:
      "Start with the work someone has actually described. Check timing, terms, location and the person offering it before making a commitment.",
    goodFor: [
      "Finding short shifts, practical tasks or local work",
      "Understanding what a listing says before responding",
      "Offering your own skills when you have something real to contribute",
    ],
    nextStep:
      "The map shows only work records currently available in your selected place. A quiet map is not a promise that work is available elsewhere.",
    contribution: "a real work opportunity or paid task",
  },
  {
    slug: "experiences",
    layer: "experience",
    label: "Experiences & learning",
    heading: "Learn something by doing it with people",
    description:
      "Explore experiences, workshops and activities that have been recorded in a place you choose.",
    introduction:
      "Look for a practical activity, a skill to try or a shared experience. Read the details and ask the host to confirm dates, costs and availability.",
    goodFor: [
      "Finding hands-on learning and small-group activities",
      "Discovering experiences outside a conventional itinerary",
      "Sharing an activity you can genuinely host",
    ],
    nextStep:
      "Suggestions are not bookings. Confirm details with the organiser before you travel or pay.",
    contribution: "an experience, workshop or activity",
  },
  {
    slug: "music",
    layer: "music",
    label: "Music & sound",
    heading: "Find the people making music around you",
    description:
      "Explore music sessions, performances and sound-related activities recorded in your chosen place.",
    introduction:
      "From a practice session to a performance, start with what a person or organiser has actually posted. Dates and venue details may change, so verify them directly.",
    goodFor: [
      "Finding recorded live music and music sessions",
      "Connecting with a venue or organiser about an event",
      "Sharing a genuine performance or music gathering",
    ],
    nextStep:
      "The map does not invent gigs or venue calendars. It can only show records the platform can currently verify or label with their known provenance.",
    contribution: "a music session, performance or sound event",
  },
  {
    slug: "art",
    layer: "art",
    label: "Artists & making",
    heading: "Meet the people making things",
    description:
      "Explore creative work, artists and hands-on making activities recorded in the place you select.",
    introduction:
      "Find a way to see, learn from or collaborate with somebody making something. The record should tell you who posted it and what is known; qualifications or availability are never assumed.",
    goodFor: [
      "Discovering local creative projects and makers",
      "Finding a workshop, open studio or collaboration opportunity",
      "Sharing a real creative activity or project",
    ],
    nextStep:
      "A category is not proof of current availability. Read the source and contact the contributor to confirm the details.",
    contribution: "a creative project, open studio or making session",
  },
  {
    slug: "community",
    layer: "community",
    label: "Community & helping out",
    heading: "Find something worth helping with",
    description:
      "Explore community projects, mutual aid and local activities people have recorded in a chosen place.",
    introduction:
      "Look for a practical way to contribute, then check the organiser, expectations, timing and any safety requirements before joining.",
    goodFor: [
      "Finding a project that needs time or practical skills",
      "Discovering a community activity or shared project",
      "Explaining what help you can genuinely offer",
    ],
    nextStep:
      "A listed need is not automatically verified or still open. Its stated status and freshness matter; confirm before acting.",
    contribution: "a community project or a specific offer to help",
  },
  {
    slug: "people",
    layer: "people",
    label: "People & connection",
    heading: "Make room for real-world connection",
    description:
      "Explore invitations and activities that are explicitly shared by people open to meeting or doing something together.",
    introduction:
      "Use the platform to find a real-world reason to connect, not a popularity ranking. Respect consent, personal boundaries and the visibility chosen by the person who posted.",
    goodFor: [
      "Finding a public activity where meeting people feels natural",
      "Joining a shared interest or locally organised gathering",
      "Posting an invitation with clear expectations and boundaries",
    ],
    nextStep:
      "The map is not a live people tracker. A profile, skill or interest does not mean a person is nearby or available to meet.",
    contribution: "a clear, consent-based invitation or group activity",
  },
  {
    slug: "nature",
    layer: "nature",
    label: "Nature & outdoors",
    heading: "Find a reason to get outside",
    description:
      "Explore outdoor activities, nature-related projects and places with recorded things to do.",
    introduction:
      "Look for a walk, a conservation task or an outdoor activity. Check access, weather, accessibility and organiser information before setting out.",
    goodFor: [
      "Finding recorded outdoor activities and conservation projects",
      "Planning a purposeful break in the open air",
      "Sharing a real nature-based gathering or volunteer task",
    ],
    nextStep:
      "Map positions are place-level and may be approximate. Do not treat a pin as an exact address, live route or guarantee of access.",
    contribution: "an outdoor activity or conservation project",
  },
  {
    slug: "food",
    layer: "food",
    label: "Food & shared tables",
    heading: "Find a table, meal or food gathering",
    description:
      "Explore food-related gatherings, shared tables and activities that have been recorded in a chosen place.",
    introduction:
      "Use the details to understand what is offered and by whom. Confirm time, price, dietary needs, capacity and whether a place is actually available.",
    goodFor: [
      "Finding a recorded shared meal or food gathering",
      "Exploring food-related experiences and community tables",
      "Sharing a real event or invitation around food",
    ],
    nextStep:
      "A food-related pin is not a restaurant booking or a confirmation of remaining capacity. Contact the host or venue to verify.",
    contribution: "a shared table, food event or cooking activity",
  },
] as const;

export const EXPLORE_TOPIC_PATHS: readonly string[] = EXPLORE_TOPICS.map(
  (topic) => `/explore/${topic.slug}`,
);

export function getExploreTopic(slug: string): ExploreTopic | undefined {
  return EXPLORE_TOPICS.find((topic) => topic.slug === slug);
}
