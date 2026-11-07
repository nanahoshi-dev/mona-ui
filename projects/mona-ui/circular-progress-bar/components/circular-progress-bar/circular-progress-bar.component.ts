import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, contentChild, effect, inject, input, isDevMode } from "@angular/core";
import { getPercentage, normalizeProgressRange } from "@nanahoshi/mona-ui/common";
import { formatNumber, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import type { Action } from "@nanahoshi/mona-ui/internal";
import { PROGRESS_BAR_DEFAULT_MESSAGES } from "@nanahoshi/mona-ui/progress-bar";
import { twMerge } from "tailwind-merge";
import { CircularProgressBarLabelTemplateDirective } from "../../directives/circular-progress-bar-label-template.directive";
import {
    circularProgressBarBaseThemeVariants,
    type CircularProgressBarVariantInput
} from "../../styles/circular-progress-bar.styles";

@Component({
    selector: "mona-circular-progress-bar",
    templateUrl: "./circular-progress-bar.component.html",
    styles: `
        .indeterminate {
            animation: rotate 2s linear infinite;
        }

        @keyframes rotate {
            0% {
                transform: rotate(0deg);
            }
            50% {
                transform: rotate(180deg);
            }
            100% {
                transform: rotate(360deg);
            }
        }

        @keyframes fade {
            50% {
                opacity: 0.4;
            }
        }

        /* A partial arc that stands still looks like a value, so fade it instead. */
        @media (prefers-reduced-motion: reduce) {
            .indeterminate {
                animation: fade 2s ease-in-out infinite;
            }
        }
    `,
    imports: [NgTemplateOutlet],
    host: {
        "[class]": "baseClasses()",
        "[attr.aria-label]": "ariaLabel() || messages().label",
        "[attr.aria-valuemin]": "ariaRange()?.min",
        "[attr.aria-valuemax]": "ariaRange()?.max",
        "[attr.aria-valuenow]": "ariaRange()?.now",
        "[attr.aria-valuetext]": "ariaValueText() || null",
        "[attr.aria-disabled]": "disabled() || null",
        "[attr.data-disabled]": "disabled()",
        role: "progressbar",
        "[style.width]": "pixelSize()",
        "[style.height]": "pixelSize()"
    }
})
export class CircularProgressBarComponent implements CircularProgressBarVariantInput {
    readonly #i18n = inject(MonaI18nService);
    protected readonly ariaRange = computed(() => {
        return this.indeterminate() ? null : normalizeProgressRange(this.value(), this.min(), this.max());
    });
    protected readonly baseClasses = computed(() => {
        const disabled = this.disabled();
        const classes = circularProgressBarBaseThemeVariants({ disabled });
        const animateClass = this.animate() ? "" : "[&_svg_circle]:transition-none";
        return twMerge(classes, this.userClass(), animateClass);
    });
    protected readonly center = computed(() => ({
        x: this.size() / 2,
        y: this.size() / 2
    }));
    protected readonly circumference = computed(() => 2 * Math.PI * this.radius());
    protected readonly formattedProgress = computed(() => {
        return formatNumber(this.progress() / 100, this.#i18n.localeId(), {
            maximumFractionDigits: 2,
            minimumFractionDigits: 0,
            style: "percent",
            useGrouping: false
        });
    });
    protected readonly labelTemplate = contentChild(CircularProgressBarLabelTemplateDirective);
    protected readonly messages = this.#i18n.componentMessages("progressBar", PROGRESS_BAR_DEFAULT_MESSAGES);
    protected readonly pixelSize = computed(() => `${this.size()}px`);
    protected readonly progress = computed(() => getPercentage(this.value(), this.min(), this.max()));
    protected readonly radius = computed(() => Math.max(0, this.size() / 2 - this.thickness() / 2));
    protected readonly strokeColor = computed(() => {
        if (typeof this.color() === "string") {
            return this.color() || "var(--mona-indicator-color, var(--color-primary))";
        }
        const colorize = this.color() as Action<number, string>;
        return colorize(this.progress());
    });
    protected readonly strokeDashOffset = computed(() => {
        const progress = Math.min(Math.max(this.progress(), 0), 100);
        const dashOffset = this.circumference() * (1 - progress / 100);
        return this.indeterminate() ? this.circumference() / 1.42 : dashOffset;
    });

    /**
     * @description Enables CSS transitions on stroke and color changes.
     * Set to `false` when updating `value` at a high frequency.
     * @default true
     */
    public readonly animate = input(true);

    /**
     * @description Accessible name for the host element. Describe what the component represents (e.g., "Upload progress").
     * When empty, falls back to the localized "Progress". An `aria-labelledby` on the host takes precedence over both.
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description Human-readable override for the `aria-valuenow` announcement.
     * Useful in indeterminate mode — set to a localized string such as `"Loading"`
     * so screen readers announce state rather than silence.
     * When empty, assistive technology falls back to the numeric value.
     * @default ""
     */
    public readonly ariaValueText = input("", { alias: "aria-valuetext" });

    /**
     * @description Accent color. Pass a CSS color string, or a function receiving the current percentage (0–100) and
     * returning a string. When empty, falls back to the primary theme color.
     * @default ""
     */
    public readonly color = input<string | Action<number, string>>("");

    /**
     * @description Renders the component with reduced visual emphasis and removes pointer interaction.
     * @default false
     */
    public readonly disabled = input(false);

    /**
     * @description Activates indeterminate mode when the completion value is unknown.
     * ARIA value attributes are removed.
     * @default false
     */
    public readonly indeterminate = input(false);

    /**
     * @description Controls label visibility in determinate mode.
     * Has no effect in indeterminate mode, where the label is always hidden.
     * @default true
     */
    public readonly labelVisible = input(true);

    /**
     * @description Upper bound of the value range. Must be greater than `min`; with a range the wrong way round, the bar
     * reports no values and a warning is logged in development.
     * @default 100
     */
    public readonly max = input(100);

    /**
     * @description Lower bound of the value range.
     * @default 0
     */
    public readonly min = input(0);

    /**
     * @description Diameter of the indicator in pixels. Controls both width and height of the host element.
     * @default 100
     */
    public readonly size = input(100);

    /**
     * @description Stroke width of the circular track in pixels.
     * @default 6
     */
    public readonly thickness = input(6);

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Current progress value within `[min, max]`. Values outside the range are clamped, for the ring and
     * for `aria-valuenow`; non-finite values count as `min`.
     * @default 0
     */
    public readonly value = input(0);

    public constructor() {
        if (isDevMode()) {
            effect(() => {
                if (!this.indeterminate() && this.ariaRange() === null) {
                    console.warn(`mona-circular-progress-bar: [${this.min()}, ${this.max()}] isn't a valid range.`);
                }
            });
        }
    }
}
