import { LAYERS, type LayerId } from "@/lib/world-data";
import { useLocale, type TranslationKey } from "@/lib/locale";
import { layerBg } from "./layer-colour";

const LAYER_LABEL_KEYS: Record<LayerId, TranslationKey> = {
  work: "layer.work",
  experience: "layer.experience",
  music: "layer.music",
  art: "layer.art",
  community: "layer.community",
  people: "layer.people",
  nature: "layer.nature",
  food: "layer.food",
};

export function LayerFilter({
  active,
  onChange,
}: {
  active: LayerId[];
  onChange: (next: LayerId[]) => void;
}) {
  const { t } = useLocale();
  const toggle = (id: LayerId) =>
    onChange(active.includes(id) ? active.filter((x) => x !== id) : [...active, id]);

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={t("map.layers")}>
      <button
        type="button"
        onClick={() => onChange([])}
        aria-pressed={active.length === 0}
        className={`focus-ink min-h-11 rounded-full border px-3 py-1.5 text-sm transition-colors ${
          active.length === 0
            ? "border-transparent bg-primary text-primary-foreground"
            : "border-border bg-card text-muted-foreground hover:text-foreground"
        }`}
      >
        {t("map.everything")}
      </button>
      {LAYERS.map((layer) => {
        const on = active.includes(layer.id);
        return (
          <button
            key={layer.id}
            type="button"
            onClick={() => toggle(layer.id)}
            aria-pressed={on}
            className={`focus-ink flex items-center gap-1.5 min-h-11 rounded-full border px-3 py-1.5 text-sm transition-colors ${
              on
                ? "border-transparent bg-secondary text-secondary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-2 w-2 shrink-0 rounded-full ${layerBg[layer.id]}`}
            />
            {t(LAYER_LABEL_KEYS[layer.id])}
          </button>
        );
      })}
    </div>
  );
}
