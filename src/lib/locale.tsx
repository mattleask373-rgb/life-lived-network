import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const SUPPORTED_LOCALES = ["en", "pt", "es", "ja"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  pt: "Português",
  es: "Español",
  ja: "日本語",
};

export const LOCALE_TAGS: Record<Locale, string> = {
  en: "en-GB",
  pt: "pt-PT",
  es: "es-ES",
  ja: "ja-JP",
};

const EN = {
  "language.label": "Choose language",
  "nav.main": "Main navigation",
  "nav.mainTabs": "Main tabs",
  "nav.explore": "Explore",
  "nav.exploreBlurb": "What's around you",
  "nav.addSomething": "Add something real",
  "nav.lifeList": "Your life list",
  "nav.memories": "Places I've known",
  "nav.find": "Find",
  "nav.findBlurb": "What you need, or can give",
  "nav.haveHour": "I have an hour",
  "nav.whatCanDo": "What you can do",
  "nav.waysEarn": "Ways to earn",
  "nav.conversations": "Conversations",
  "nav.journey": "Journey",
  "nav.journeyBlurb": "What's along your way",
  "nav.longerStay": "Shape a longer stay",
  "nav.account": "Account",
  "nav.yourAccount": "Your account",
  "nav.signIn": "Sign in",
  "nav.you": "You",
  "map.layers": "What to show on the map",
  "map.everything": "Everything",
  "layer.work": "Work",
  "layer.experience": "Experiences",
  "layer.music": "Music",
  "layer.art": "Artists",
  "layer.community": "Community",
  "layer.people": "People",
  "layer.nature": "Nature",
  "layer.food": "Food",
  "money.free": "Free",
  "money.pays": "Pays",
  "duration.none": "No fixed time",
  "duration.minutesShort": "min",
  "duration.hoursShort": "hr",
  "detail.when": "When",
  "detail.takes": "Takes",
  "detail.money": "Money",
} as const;

export type TranslationKey = keyof typeof EN;
type Dictionary = Record<TranslationKey, string>;

const MESSAGES: Record<Locale, Dictionary> = {
  en: EN,
  pt: {
    "language.label": "Escolher idioma",
    "nav.main": "Navegação principal",
    "nav.mainTabs": "Separadores principais",
    "nav.explore": "Explorar",
    "nav.exploreBlurb": "O que há à sua volta",
    "nav.addSomething": "Partilhar algo real",
    "nav.lifeList": "A sua lista de vida",
    "nav.memories": "Lugares que conheci",
    "nav.find": "Encontrar",
    "nav.findBlurb": "O que precisa ou pode oferecer",
    "nav.haveHour": "Tenho uma hora",
    "nav.whatCanDo": "O que pode fazer",
    "nav.waysEarn": "Formas de ganhar",
    "nav.conversations": "Conversas",
    "nav.journey": "Percurso",
    "nav.journeyBlurb": "O que encontra pelo caminho",
    "nav.longerStay": "Planear uma estadia mais longa",
    "nav.account": "Conta",
    "nav.yourAccount": "A sua conta",
    "nav.signIn": "Entrar",
    "nav.you": "Perfil",
    "money.free": "Grátis",
    "money.pays": "Paga",
    "duration.none": "Sem duração fixa",
    "duration.minutesShort": "min",
    "duration.hoursShort": "h",
    "detail.when": "Quando",
    "detail.takes": "Duração",
    "detail.money": "Custo",
    "map.layers": "O que mostrar no mapa",
    "map.everything": "Tudo",
    "layer.work": "Trabalho",
    "layer.experience": "Experiências",
    "layer.music": "Música",
    "layer.art": "Artistas",
    "layer.community": "Comunidade",
    "layer.people": "Pessoas",
    "layer.nature": "Natureza",
    "layer.food": "Comida",
  },
  es: {
    "language.label": "Elegir idioma",
    "nav.main": "Navegación principal",
    "nav.mainTabs": "Pestañas principales",
    "nav.explore": "Explorar",
    "nav.exploreBlurb": "Qué hay a tu alrededor",
    "nav.addSomething": "Compartir algo real",
    "nav.lifeList": "Tu lista de vida",
    "nav.memories": "Lugares que he conocido",
    "nav.find": "Encontrar",
    "nav.findBlurb": "Lo que necesitas o puedes ofrecer",
    "nav.haveHour": "Tengo una hora",
    "nav.whatCanDo": "Lo que puedes hacer",
    "nav.waysEarn": "Formas de ganar",
    "nav.conversations": "Conversaciones",
    "nav.journey": "Viaje",
    "nav.journeyBlurb": "Qué hay en tu camino",
    "nav.longerStay": "Planear una estancia más larga",
    "nav.account": "Cuenta",
    "nav.yourAccount": "Tu cuenta",
    "nav.signIn": "Iniciar sesión",
    "nav.you": "Tú",
    "money.free": "Gratis",
    "money.pays": "Paga",
    "duration.none": "Sin duración fija",
    "duration.minutesShort": "min",
    "duration.hoursShort": "h",
    "detail.when": "Cuándo",
    "detail.takes": "Duración",
    "detail.money": "Coste",
    "map.layers": "Qué mostrar en el mapa",
    "map.everything": "Todo",
    "layer.work": "Trabajo",
    "layer.experience": "Experiencias",
    "layer.music": "Música",
    "layer.art": "Artistas",
    "layer.community": "Comunidad",
    "layer.people": "Personas",
    "layer.nature": "Naturaleza",
    "layer.food": "Comida",
  },
  ja: {
    "language.label": "言語を選択",
    "nav.main": "メインナビゲーション",
    "nav.mainTabs": "メインタブ",
    "nav.explore": "見つける",
    "nav.exploreBlurb": "近くでできること",
    "nav.addSomething": "本当の出来事を共有",
    "nav.lifeList": "やってみたいこと",
    "nav.memories": "知っている場所",
    "nav.find": "探す",
    "nav.findBlurb": "必要なこと、できること",
    "nav.haveHour": "1時間あります",
    "nav.whatCanDo": "できること",
    "nav.waysEarn": "収入につながること",
    "nav.conversations": "会話",
    "nav.journey": "旅",
    "nav.journeyBlurb": "道中で出会えること",
    "nav.longerStay": "長めの滞在を考える",
    "nav.account": "アカウント",
    "nav.yourAccount": "あなたのアカウント",
    "nav.signIn": "ログイン",
    "nav.you": "あなた",
    "money.free": "無料",
    "money.pays": "報酬",
    "duration.none": "時間指定なし",
    "duration.minutesShort": "分",
    "duration.hoursShort": "時間",
    "detail.when": "日時",
    "detail.takes": "所要時間",
    "detail.money": "費用",
    "map.layers": "地図に表示するもの",
    "map.everything": "すべて",
    "layer.work": "仕事",
    "layer.experience": "体験",
    "layer.music": "音楽",
    "layer.art": "アート",
    "layer.community": "コミュニティ",
    "layer.people": "人々",
    "layer.nature": "自然",
    "layer.food": "食べ物",
  },
};

const STORAGE_KEY = "atlas.locale.v1";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function translate(locale: Locale, key: TranslationKey): string {
  return MESSAGES[locale][key] ?? MESSAGES.en[key] ?? key;
}

export function formatLocalizedCurrency(cost: number, currency: string, locale: Locale): string {
  const amount = new Intl.NumberFormat(LOCALE_TAGS[locale], {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(cost) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(cost));
  if (cost < 0) return translate(locale, "money.pays") + " " + amount;
  if (cost === 0) return translate(locale, "money.free");
  return amount;
}

export function formatLocalizedDuration(minutes: number, locale: Locale): string {
  if (minutes === 0) return translate(locale, "duration.none");
  if (minutes < 60) {
    const value = new Intl.NumberFormat(LOCALE_TAGS[locale], {
      maximumFractionDigits: 0,
    }).format(minutes);
    return value + " " + translate(locale, "duration.minutesShort");
  }
  const hours = minutes / 60;
  const value = new Intl.NumberFormat(LOCALE_TAGS[locale], {
    maximumFractionDigits: 1,
  }).format(hours);
  return value + " " + translate(locale, "duration.hoursShort");
}

export function formatLocalizedEventDate(
  startsAt: string,
  timezone: string | undefined,
  locale: Locale,
): string {
  const at = new Date(startsAt);
  if (Number.isNaN(at.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      ...(timezone ? { timeZone: timezone } : {}),
    }).format(at);
  } catch {
    // Never silently replace an invalid event timezone with the device timezone.
    return "";
  }
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isLocale(stored)) setLocaleState(stored);
    } catch {
      // Storage can be disabled. In-memory language switching still works.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be disabled. Keep the choice for the current page session.
    }
  }, []);

  const t = useCallback((key: TranslationKey) => translate(locale, key), [locale]);
  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be rendered inside LocaleProvider");
  return value;
}
