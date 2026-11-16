import { Component, DOCUMENT, inject } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { CheckBoxComponent } from "@nanahoshi/mona-ui/check-box";
import { SliderComponent } from "@nanahoshi/mona-ui/slider";
import { SwitchComponent } from "@nanahoshi/mona-ui/switch";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";
import { builtInThemes, flattenThemeProfile, type ThemeProfile, type ThemeVariant } from "@nanahoshi/mona-ui/theme";
import { MarkdownDocComponent } from "../../layout/components/markdown-doc/markdown-doc.component";

interface ThemePreview {
    readonly id: string;
    readonly label: string;
    /** The theme's variables, set on the preview so its components draw in that theme whatever the site's is. */
    readonly style: Readonly<Record<string, string>>;
}

const EFFECT_LEVELS = ["control", "raised", "overlay"] as const;
const CONTRAST_BORDERS = [
    ["--color-border-control", "--color-border-control-contrast"],
    ["--color-border-control-hover", "--color-border-control-contrast-hover"]
] as const;

@Component({
    selector: "app-theming-built-in-themes-doc",
    imports: [
        ButtonDirective,
        CheckBoxComponent,
        MarkdownDocComponent,
        SliderComponent,
        SwitchComponent,
        TextBoxComponent
    ],
    templateUrl: "./theming-built-in-themes-doc.component.html"
})
export class ThemingBuiltInThemesDocComponent {
    readonly #document = inject(DOCUMENT);

    protected readonly previews: readonly ThemePreview[] = this.#createPreviews();

    /**
     * `ThemeService` adjusts what it writes to the user's settings, so a preview does the same: opaque materials when
     * the site's are, and the contrast borders when the user asked for more contrast.
     */
    #createPreviews(): ThemePreview[] {
        const reducedTransparency = this.#document.documentElement.getAttribute("data-mona-transparency") !== "full";
        const moreContrast = this.#document.defaultView?.matchMedia?.("(prefers-contrast: more)").matches === true;
        const options = { moreContrast, reducedTransparency };
        return [
            createPreview("Mona Light", builtInThemes.mona.variants.light, "light", options),
            createPreview("Mona Dark", builtInThemes.mona.variants.dark, "dark", options),
            createPreview("Luna Light", builtInThemes.luna.variants.light, "light", options),
            createPreview("Luna Dark", builtInThemes.luna.variants.dark, "dark", options),
            createPreview("Anna Light", builtInThemes.anna.variants.light, "light", options),
            createPreview("Anna Dark", builtInThemes.anna.variants.dark, "dark", options)
        ];
    }
}

function createPreview(
    label: string,
    profile: ThemeProfile,
    variant: ThemeVariant,
    options: { readonly moreContrast: boolean; readonly reducedTransparency: boolean }
): ThemePreview {
    // A theme without indicator colors would otherwise inherit the site theme's, where it sets them.
    const style: Record<string, string> = {
        "--mona-indicator-color": "var(--color-primary)",
        "--mona-indicator-foreground": "var(--color-primary-foreground)",
        ...flattenThemeProfile(profile),
        "color-scheme": variant
    };
    if (options.moreContrast) {
        for (const [name, replacement] of CONTRAST_BORDERS) {
            const value: string | undefined = profile.colors[replacement];
            if (value !== undefined) {
                style[name] = value;
            }
        }
    }
    if (options.reducedTransparency) {
        for (const level of EFFECT_LEVELS) {
            style[`--mona-effect-${level}-background-color`] =
                profile.effects[`--mona-effect-${level}-fallback-background-color`];
            style[`--mona-effect-${level}-background-image`] = "none";
            style[`--mona-effect-${level}-backdrop-filter`] = "none";
        }
    }
    return { id: label.toLowerCase().replace(" ", "-"), label, style };
}
