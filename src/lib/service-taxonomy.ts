/**
 * The service taxonomy.
 *
 * A shared, generic vocabulary for *what kind of service something is* — the one
 * thing the architecture was missing. Two records can now say "sports massage"
 * in a way that can be grouped, addressed and linked to, without any code ever
 * knowing about a particular trade, practice, town or keyword campaign.
 *
 * Two ways a record joins a category, and the difference is always visible:
 *
 *   DECLARED  whoever owns the record said so. Trusted as stated.
 *   MATCHED   the words the record itself already uses match the category's
 *             own words. Evidence from the record, never an assumption about
 *             the provider, and never a claim of qualification.
 *
 * Nothing here writes copy, infers a qualification from a skill, or invents a
 * local fact. A category with no real records is simply empty.
 */

import { isService } from "./services";
import type { WorldEntry } from "./world-data";

export type ServiceGroupId =
  | "health"
  | "home"
  | "creative"
  | "learning"
  | "professional"
  | "community"
  | "events";

export interface ServiceGroup {
  id: ServiceGroupId;
  label: string;
}

export const SERVICE_GROUPS: ServiceGroup[] = [
  { id: "health", label: "Health & wellbeing" },
  { id: "home", label: "Home & garden" },
  { id: "creative", label: "Creative" },
  { id: "learning", label: "Family & learning" },
  { id: "professional", label: "Professional" },
  { id: "community", label: "Community" },
  { id: "events", label: "Events" },
];

export interface ServiceCategory {
  /** URL segment. Stable; never renamed once published. */
  slug: string;
  /** Heading form, as a person would say it: "Sports massage". */
  label: string;
  /** How a page names several of them: "Sports massage therapists". */
  plural: string;
  group: ServiceGroupId;
  /**
   * The words this category is genuinely made of. Used only to recognise the
   * words a record already uses — never to generate text about a place.
   */
  words: string[];
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  // Health & wellbeing
  { slug: "osteopathy", label: "Osteopathy", plural: "Osteopaths", group: "health", words: ["osteopath", "osteopathy", "osteopathic"] },
  { slug: "sports-massage", label: "Sports massage", plural: "Sports massage therapists", group: "health", words: ["sports massage", "deep tissue", "sports therapy"] },
  { slug: "massage", label: "Massage", plural: "Massage therapists", group: "health", words: ["massage", "reflexology", "aromatherapy"] },
  { slug: "physiotherapy", label: "Physiotherapy", plural: "Physiotherapists", group: "health", words: ["physiotherapy", "physiotherapist", "physio"] },
  { slug: "yoga", label: "Yoga", plural: "Yoga teachers and classes", group: "health", words: ["yoga", "pilates", "vinyasa"] },
  { slug: "personal-training", label: "Personal training", plural: "Personal trainers", group: "health", words: ["personal training", "personal trainer", "strength coaching"] },
  { slug: "counselling", label: "Counselling & therapy", plural: "Counsellors and therapists", group: "health", words: ["counselling", "counsellor", "psychotherapy", "talking therapy"] },
  { slug: "acupuncture", label: "Acupuncture", plural: "Acupuncturists", group: "health", words: ["acupuncture", "acupuncturist"] },

  // Home & garden
  { slug: "gardening", label: "Gardening", plural: "Gardeners", group: "home", words: ["gardener", "gardening", "landscaping", "hedge"] },
  { slug: "cleaning", label: "Cleaning", plural: "Cleaners", group: "home", words: ["cleaner", "cleaning", "housekeeping"] },
  { slug: "handyman", label: "Repairs & odd jobs", plural: "Repairers and handypeople", group: "home", words: ["handyman", "handyperson", "odd jobs", "repair", "fixing"] },
  { slug: "electrician", label: "Electrical work", plural: "Electricians", group: "home", words: ["electrician", "electrical", "rewiring"] },
  { slug: "plumbing", label: "Plumbing", plural: "Plumbers", group: "home", words: ["plumber", "plumbing", "boiler"] },
  { slug: "decorating", label: "Painting & decorating", plural: "Painters and decorators", group: "home", words: ["decorator", "decorating", "painting and decorating", "plastering"] },
  { slug: "dog-walking", label: "Dog walking & pet care", plural: "Dog walkers and pet carers", group: "home", words: ["dog walking", "dog walker", "pet sitting", "pet care"] },

  // Creative
  { slug: "photography", label: "Photography", plural: "Photographers", group: "creative", words: ["photographer", "photography", "photo shoot"] },
  { slug: "wedding-photography", label: "Wedding photography", plural: "Wedding photographers", group: "creative", words: ["wedding photography", "wedding photographer"] },
  { slug: "videography", label: "Video", plural: "Videographers", group: "creative", words: ["videographer", "videography", "filming"] },
  { slug: "music-performance", label: "Live music", plural: "Musicians and bands", group: "creative", words: ["musician", "band", "live music", "gig", "dj"] },
  { slug: "art", label: "Art & making", plural: "Artists and makers", group: "creative", words: ["artist", "illustration", "printmaking", "ceramics", "sculpture"] },
  { slug: "design", label: "Design", plural: "Designers", group: "creative", words: ["graphic design", "designer", "branding", "illustrator"] },

  // Family & learning
  { slug: "tutoring", label: "Tutoring", plural: "Tutors", group: "learning", words: ["tutor", "tutoring", "revision", "exam support"] },
  { slug: "music-lessons", label: "Music lessons", plural: "Music teachers", group: "learning", words: ["music lessons", "music teacher", "guitar lessons", "piano lessons", "singing lessons"] },
  { slug: "childcare", label: "Childcare", plural: "Childcare and childminders", group: "learning", words: ["childcare", "childminder", "babysitting", "nursery"] },
  { slug: "language-lessons", label: "Language lessons", plural: "Language teachers", group: "learning", words: ["language lessons", "language teacher", "english lessons", "conversation practice"] },

  // Professional
  { slug: "accountancy", label: "Accountancy", plural: "Accountants and bookkeepers", group: "professional", words: ["accountant", "accountancy", "bookkeeping", "tax return"] },
  { slug: "legal", label: "Legal help", plural: "Solicitors and legal advisers", group: "professional", words: ["solicitor", "legal advice", "conveyancing"] },
  { slug: "consulting", label: "Consulting", plural: "Consultants", group: "professional", words: ["consultant", "consultancy", "advisory"] },
  { slug: "coaching", label: "Coaching", plural: "Coaches", group: "professional", words: ["coaching", "coach", "mentoring"] },
  { slug: "trades-training", label: "Training & courses", plural: "Trainers and courses", group: "professional", words: ["training course", "workshop", "short course", "certification"] },

  // Community
  { slug: "volunteering", label: "Volunteering", plural: "Ways to volunteer", group: "community", words: ["volunteer", "volunteering"] },
  { slug: "community-projects", label: "Community projects", plural: "Community projects", group: "community", words: ["community project", "community garden", "mutual aid", "residents"] },
  { slug: "repair-cafe", label: "Repair & reuse", plural: "Repair and reuse sessions", group: "community", words: ["repair cafe", "repair café", "reuse", "mending"] },
  { slug: "support-services", label: "Support services", plural: "Support services", group: "community", words: ["support service", "advice service", "food bank", "drop-in"] },

  // Events
  { slug: "venue-hire", label: "Room & venue hire", plural: "Rooms and venues to hire", group: "events", words: ["room hire", "venue hire", "hall hire", "studio hire"] },
  { slug: "event-services", label: "Event services", plural: "Event services", group: "events", words: ["catering", "event planning", "sound engineer", "lighting"] },
];

const BY_SLUG = new Map(SERVICE_CATEGORIES.map((category) => [category.slug, category]));

export function categoryBySlug(slug: string): ServiceCategory | null {
  return BY_SLUG.get(slug.trim().toLowerCase()) ?? null;
}

export function groupLabel(id: ServiceGroupId): string {
  return SERVICE_GROUPS.find((group) => group.id === id)?.label ?? "Services";
}

/** How a record came to sit in a category. Always shown, never hidden. */
export type CategoryBasis = "declared" | "matched";

export interface CategoryMatch {
  category: ServiceCategory;
  basis: CategoryBasis;
  /** The words in the record that put it here. Empty when declared. */
  evidence: string[];
}

function haystack(entry: WorldEntry): string {
  return [entry.title, entry.summary, ...(entry.skills ?? []), entry.kind ?? "", entry.organisation ?? ""]
    .join(" · ")
    .toLowerCase();
}

/**
 * Which categories a record genuinely belongs to. A declared category wins and
 * stands alone; otherwise the record's own words decide, and the words that
 * decided are kept so a page can say why.
 */
export function categoriesOf(entry: WorldEntry): CategoryMatch[] {
  const declared = entry.serviceCategory ? categoryBySlug(entry.serviceCategory) : null;
  if (declared) return [{ category: declared, basis: "declared", evidence: [] }];

  const text = haystack(entry);
  const matches: CategoryMatch[] = [];
  for (const category of SERVICE_CATEGORIES) {
    const evidence = category.words.filter((word) => text.includes(word));
    if (evidence.length) matches.push({ category, basis: "matched", evidence });
  }
  // Most specific first: the category with the most of its own words present.
  return matches.sort(
    (a, b) => b.evidence.length - a.evidence.length || a.category.label.localeCompare(b.category.label),
  );
}

/** The single best category for a record, or nothing when none genuinely fits. */
export function categoryOf(entry: WorldEntry): CategoryMatch | null {
  return categoriesOf(entry)[0] ?? null;
}

/** True when the record belongs in this category. Nothing is stretched to fit. */
export function inCategory(entry: WorldEntry, slug: string): boolean {
  return categoriesOf(entry).some((match) => match.category.slug === slug);
}

export interface CategoryPresence {
  category: ServiceCategory;
  /** Records genuinely in this category, still current. */
  entries: WorldEntry[];
  /** True when every record here is a labelled demonstration. */
  demonstrationOnly: boolean;
}

/**
 * The categories a set of records actually contains. A category with nothing in
 * it never appears, which is what keeps a locality page honest rather than a
 * grid of empty promises.
 */
export function categoriesPresent(entries: WorldEntry[]): CategoryPresence[] {
  const current = entries.filter(
    (entry) => entry.quality !== "expired" && !entry.cancellation && isService(entry),
  );
  const buckets = new Map<string, WorldEntry[]>();
  for (const entry of current) {
    for (const match of categoriesOf(entry)) {
      const list = buckets.get(match.category.slug) ?? [];
      list.push(entry);
      buckets.set(match.category.slug, list);
    }
  }
  return [...buckets.entries()]
    .map(([slug, list]) => {
      const category = categoryBySlug(slug)!;
      return {
        category,
        entries: [...list].sort((a, b) => a.title.localeCompare(b.title)),
        demonstrationOnly: list.every((entry) => entry.demonstration === true),
      };
    })
    .sort(
      (a, b) =>
        b.entries.length - a.entries.length || a.category.label.localeCompare(b.category.label),
    );
}
