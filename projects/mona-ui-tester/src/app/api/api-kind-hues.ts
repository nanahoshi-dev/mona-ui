import type { ApiSymbolKind } from "./api-model";
import type { ApiSectionKind } from "./api-text";

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

/**
 * The hue of each section of a symbol's page, mostly borrowed from the kind it's most like: a template context takes a
 * directive's, properties an interface's, methods a function's, an enum's members its own, and inherited members a
 * class's quiet slate. Inputs and outputs, which a template binds, take blue and green.
 */
export const SECTION_HUES: Readonly<Record<ApiSectionKind, string>> = {
    inherited: KIND_HUES.class,
    inputs: "oklch(66% 0.14 235)",
    members: KIND_HUES.enum,
    methods: KIND_HUES.function,
    outputs: "oklch(66% 0.15 160)",
    properties: KIND_HUES.interface,
    "template-context": KIND_HUES.directive
};
