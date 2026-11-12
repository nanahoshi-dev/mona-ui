import type { ApiSymbolKind } from "./api-model";

/**
 * The hue of each kind of export, which the reference's cards and filters set as `--api-kind`. The `api-kind-*` classes
 * in `styles.css` mix it with the theme's background and text colors rather than using it as it is, so the tint stays
 * faint and the label readable in every theme, light or dark.
 */
export const KIND_HUES: Readonly<Record<ApiSymbolKind, string>> = {
    class: "oklch(60% 0.035 260)",
    component: "oklch(66% 0.14 235)",
    constant: "oklch(70% 0.16 50)",
    directive: "oklch(76% 0.16 75)",
    enum: "oklch(64% 0.22 330)",
    function: "oklch(64% 0.2 15)",
    interface: "oklch(60% 0.18 270)",
    pipe: "oklch(62% 0.2 300)",
    service: "oklch(66% 0.15 160)",
    type: "oklch(66% 0.12 190)"
};
