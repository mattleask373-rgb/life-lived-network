/**
 * Care where care is due.
 *
 * Some things are regulated in most places: therapy, medical care, gas,
 * electricity, driving people around, advising on money, looking after
 * children. The app never implies someone is allowed to do them because they
 * typed a word into a box.
 *
 * This file draws no legal conclusions. It flags "this needs checking" and
 * says so in human words.
 */

export type RegulatedArea =
  | "mental_health"
  | "healthcare"
  | "childcare"
  | "electrical"
  | "gas_and_heating"
  | "transport_of_people"
  | "financial_advice"
  | "legal_advice"
  | "food_for_sale"
  | "construction";

interface Rule {
  area: RegulatedArea;
  words: string[];
  note: string;
}

const RULES: Rule[] = [
  {
    area: "mental_health",
    words: ["therapy", "therapist", "counselling", "counsellor", "psychotherapy", "psychologist"],
    note: "Therapy and counselling are usually regulated. Ask what they're registered with.",
  },
  {
    area: "healthcare",
    words: ["nurse", "nursing", "medical", "doctor", "physio", "midwife", "dentist", "care home"],
    note: "Medical and nursing work is regulated. Registration is worth checking.",
  },
  {
    area: "childcare",
    words: ["childcare", "childminder", "nanny", "babysit", "babysitting", "creche", "nursery"],
    note: "Looking after children usually needs checks. Please ask, and take your time.",
  },
  {
    area: "electrical",
    words: ["electrical", "electrician", "rewire", "wiring", "fuse box", "consumer unit"],
    note: "Electrical work is regulated almost everywhere. Ask about certification.",
  },
  {
    area: "gas_and_heating",
    words: ["gas", "boiler", "heating engineer", "plumbing gas"],
    note: "Gas work is restricted to registered engineers. Ask for the registration.",
  },
  {
    area: "transport_of_people",
    words: ["taxi", "minicab", "driving people", "passengers", "airport transfer", "ride"],
    note: "Carrying people for money normally needs a licence and the right insurance.",
  },
  {
    area: "financial_advice",
    words: ["financial advice", "investment", "mortgage", "pension", "insurance advice"],
    note: "Advising on money is regulated. Ask who authorises them.",
  },
  {
    area: "legal_advice",
    words: ["legal advice", "solicitor", "lawyer", "immigration advice", "conveyancing"],
    note: "Some legal advice can only be given by regulated people.",
  },
  {
    area: "food_for_sale",
    words: ["catering", "food to sell", "selling food", "street food", "kitchen hire"],
    note: "Selling food usually means registration and hygiene rules.",
  },
  {
    area: "construction",
    words: ["scaffolding", "structural", "roofing", "asbestos", "demolition"],
    note: "Building work of this kind carries real safety rules and often insurance.",
  },
];

export interface PolicyFlag {
  area: RegulatedArea;
  matched: string;
  note: string;
}

/** Flags anything in the given text that is commonly regulated. */
export function regulatedFlags(text: string): PolicyFlag[] {
  const haystack = text.toLowerCase();
  const flags: PolicyFlag[] = [];
  for (const rule of RULES) {
    const matched = rule.words.find((w) => haystack.includes(w));
    if (matched) flags.push({ area: rule.area, matched, note: rule.note });
  }
  return flags;
}

export function isRegulated(text: string): boolean {
  return regulatedFlags(text).length > 0;
}

/** One calm sentence to show beside anything flagged. */
export const REGULATED_CAVEAT =
  "This is the kind of thing that's usually regulated. Nobody here has checked it — please ask them directly before you rely on it.";
