/**
 * Offline deterministic Ticketmaster Discovery API fixtures.
 *
 * Used for testing and proving external-world ingestion without live credentials.
 */

export const DRAKE_BIRMINGHAM_FIXTURE = {
  id: "tm-drake-birmingham-2026",
  name: "Drake — $ell Your Soul Tour",
  url: "https://www.ticketmaster.co.uk/event/tm-drake-birmingham-2026",
  info: "Drake live at Utilita Arena Birmingham.",
  pleaseNote: "Under 14s must be accompanied by an adult over 18.",
  dates: {
    start: {
      dateTime: "2026-11-20T19:30:00Z",
      localDate: "2026-11-20",
      localTime: "19:30:00",
    },
    end: {
      dateTime: "2026-11-20T23:00:00Z",
    },
    timezone: "Europe/London",
    status: {
      code: "onsale",
    },
  },
  classifications: [
    {
      segment: { name: "Music" },
      genre: { name: "Hip-Hop/Rap" },
    },
  ],
  priceRanges: [
    {
      min: 75.0,
      max: 180.0,
      currency: "GBP",
    },
  ],
  images: [
    {
      url: "https://s1.ticketm.net/img/drake-birmingham.jpg",
      width: 1024,
      height: 768,
    },
  ],
  _embedded: {
    venues: [
      {
        id: "venue-utilita-bham",
        name: "Utilita Arena Birmingham",
        city: { name: "Birmingham" },
        country: { name: "United Kingdom", countryCode: "GB" },
        location: {
          latitude: "52.4797",
          longitude: "-1.9149",
        },
      },
    ],
    attractions: [
      {
        id: "attraction-drake",
        name: "Drake",
      },
    ],
  },
};

export const DUBLIN_COMEDY_FIXTURE = {
  id: "tm-dublin-comedy-2026",
  name: "Dublin International Comedy Night",
  url: "https://www.ticketmaster.ie/event/tm-dublin-comedy-2026",
  info: "An evening of stand-up comedy in Dublin.",
  dates: {
    start: {
      dateTime: "2026-12-05T20:00:00Z",
      localDate: "2026-12-05",
      localTime: "20:00:00",
    },
    timezone: "Europe/Dublin",
    status: {
      code: "onsale",
    },
  },
  classifications: [
    {
      segment: { name: "Arts & Theatre" },
      genre: { name: "Comedy" },
    },
  ],
  priceRanges: [
    {
      min: 25.0,
      currency: "EUR",
    },
  ],
  _embedded: {
    venues: [
      {
        id: "venue-vicar-st",
        name: "Vicar Street",
        city: { name: "Dublin" },
        country: { name: "Ireland", countryCode: "IE" },
        location: {
          latitude: "53.3429",
          longitude: "-6.2778",
        },
      },
    ],
    attractions: [
      {
        name: "Various Comedians",
      },
    ],
  },
};

export const CANCELLED_FIXTURE = {
  id: "tm-cancelled-gig-001",
  name: "Cancelled Indie Showcase",
  url: "https://www.ticketmaster.co.uk/event/tm-cancelled-gig-001",
  dates: {
    start: {
      dateTime: "2026-11-10T19:00:00Z",
    },
    timezone: "Europe/London",
    status: {
      code: "cancelled",
    },
  },
  _embedded: {
    venues: [
      {
        name: "O2 Institute",
        city: { name: "Birmingham" },
        country: { countryCode: "GB" },
      },
    ],
  },
};

export const POSTPONED_FIXTURE = {
  id: "tm-postponed-gig-002",
  name: "Postponed Jazz Night",
  url: "https://www.ticketmaster.co.uk/event/tm-postponed-gig-002",
  dates: {
    start: {
      dateTime: "2026-11-15T20:00:00Z",
    },
    timezone: "Europe/London",
    status: {
      code: "rescheduled",
    },
  },
  _embedded: {
    venues: [
      {
        name: "The Jam House",
        city: { name: "Birmingham" },
        country: { countryCode: "GB" },
      },
    ],
  },
};

export const UNKNOWN_LOCALITY_FIXTURE = {
  id: "tm-unknown-place-003",
  name: "Pop-up in Unmapped Faraway Valley",
  url: "https://www.ticketmaster.com/event/tm-unknown-place-003",
  dates: {
    start: {
      dateTime: "2026-11-25T18:00:00Z",
    },
    timezone: "UTC",
    status: {
      code: "onsale",
    },
  },
  _embedded: {
    venues: [
      {
        name: "Secret Remote Camp",
        city: { name: "Nonexistentville" },
        country: { countryCode: "XX" },
      },
    ],
  },
};
