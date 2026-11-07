import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, contentChild, effect, inject, input, isDevMode } from "@angular/core";
import { getPercentage, normalizeProgressRange } from "@nanahoshi/mona-ui/common";
import { formatNumber, injectComponentDirection, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import type { Action } from "@nanahoshi/mona-ui/internal";
import { twMerge } from "tailwind-merge";
import { ProgressBarLabelTemplateDirective } from "../../directives/progress-bar-label-template.directive";
import { PROGRESS_BAR_DEFAULT_MESSAGES } from "../../i18n/progress-bar.default-messages";
import type { LabelPosition } from "../../models/LabelPosition";
import {
    progressBarBaseThemeVariants,
    progressBarIndeterminateThemeVariants,
    progressBarLabelThemeVariants,
    progressBarTrackThemeVariants,
    type ProgressBarVariantInput,
    type ProgressBarVariantProps
} from "../../styles/progress-bar.styles";

@Component({
    selector: "mona-progress-bar",
    templateUrl: "./progress-bar.component.html",
    styles: `
        .indeterminate {
            animation: indeterminate 16s linear infinite;
        }
        @keyframes indeterminate {
            0% {
                background-position: 0 0;
            }
            100% {
                background-position: 100% 0;
            }
        }
        @media (prefers-reduced-motion: reduce) {
            .indeterminate {
                animation: none;
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
        role: "progressbar"
    }
})
export class ProgressBarComponent implements ProgressBarVariantInput {
    readonly #color = computed(() => {
        if (this.disabled()) {
            return "";
        }
        const color = this.color();
        const progress = this.progress();
        return typeof color === "string" ? color : color?.(progress);
    });
    readonly #direction = injectComponentDirection();
    readonly #i18n = inject(MonaI18nService);
    protected readonly ariaRange = computed(() => {
        return this.indeterminate() ? null : normalizeProgressRange(this.value(), this.min(), this.max());
    });
    protected readonly baseClasses = computed(() => {
        const rounded = this.rounded();
        const classes = progressBarBaseThemeVariants({ rounded });
        const userClass = this.userClass();
        return twMerge(classes, userClass);
    });
    protected readonly formattedProgress = computed(() => {
        return formatNumber(this.progress() / 100, this.#i18n.localeId(), {
            maximumFractionDigits: 2,
            minimumFractionDigits: 0,
            style: "percent",
            useGrouping: false
        });
    });
    protected readonly indeterminateClasses = computed(() => {
        return progressBarIndeterminateThemeVariants();
    });
    protected readonly isRtl = computed(() => this.#direction() === "rtl");
    protected readonly labelClasses = computed(() => {
        return progressBarLabelThemeVariants();
    });
    protected readonly labelTemplate = contentChild(ProgressBarLabelTemplateDirective);
    protected readonly messages = this.#i18n.componentMessages("progressBar", PROGRESS_BAR_DEFAULT_MESSAGES);
    protected readonly nextTrackClipPath = computed(() => {
        const progress = this.progress();
        const isRtl = this.isRtl();
        return isRtl
            ? `inset(-1px ${progress}% -1px -1px)`
            : `inset(-1px -1px -1px ${progress}%)`;
    });
    protected readonly prevTrackClipPath = computed(() => {
        const progress = this.progress();
        const indeterminate = this.indeterminate();
        if (indeterminate) {
            return `inset(-1px -1px -1px -1px)`;
        }
        const offset = progress < 100 ? 8 : 0;
        const isRtl = this.isRtl();
        return isRtl
            ? `inset(-1px 0px -1px ${offset}px)`
            : `inset(-1px ${offset}px -1px 0px)`;
    });
    protected readonly progress = computed(() => getPercentage(this.value(), this.min(), this.max()));
    protected readonly trackClasses = computed(() => {
        const rounded = this.rounded();
        const classes = progressBarTrackThemeVariants({ rounded });
        return this.animate()
            ? classes
            : twMerge(classes, "data-[next='true']:transition-none data-[prev='true']:transition-none");
    });
    protected readonly trackColor = this.#color;

    /**
     * @description Enables CSS transitions on fill and color changes.
     * Set to `false` when updating `value` at high frequency (e.g., a real-time byte counter).
     * @default true
     */
    public readonly animate = input(true);

    /**
     * @description Accessible label for the progress bar host element.
     * Use to describe what is being measured (e.g., "Upload progress").
     * When empty, falls back to the localized "Progress". An `aria-labelledby` on the host takes precedence over both.
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description Overrides the numeric aria-valuenow announcement for assistive technology.
     * Particularly useful in indeterminate mode — set to a localized string such as "Loading"
     * so screen readers announce state rather than silence.
     * When empty, assistive technology falls back to the numeric value.
     * @default ""
     */
    public readonly ariaValueText = input("", { alias: "aria-valuetext" });

    /**
     * @description Fill color of the progress track.
     * Pass a CSS color string, or a function that receives the current percentage (0–100) and returns a color string.
     * When empty, falls back to the primary theme color.
     * @default ""
     */
    public readonly color = input<string | Action<number, string>>("");

    /**
     * @description Renders the bar with reduced visual emphasis and removes pointer interaction. `color` doesn't apply
     * while disabled.
     * @default false
     */
    public readonly disabled = input(false);

    /**
     * @description Switches to indeterminate mode: plays a looping animation and hides the label.
     * ARIA value attributes are removed.
     * @default false
     */
    public readonly indeterminate = input(false);

    /**
     * @description Horizontal alignment of the label within the bar.
     * @default center
     */
    public readonly labelPosition = input<LabelPosition>("center");

    /**
     * @description Inline styles applied to the default label span.
     * Has no effect when a custom `monaProgressBarLabelTemplate` is provided.
     * @default {}
     */
    public readonly labelStyles = input<Partial<CSSStyleDeclaration>>({});

    /**
     * @description Controls label visibility in determinate mode.
     * Has no effect in indeterminate mode — the label is always hidden there.
     * @default true
     */
    public readonly labelVisible = input(true);

    /**
     * @description Upper bound of the value range. Must be greater than `min`; otherwise the bar reports no values and a
     * warning is logged in development.
     * @default 100
     */
    public readonly max = input(100);

    /**
     * @description Lower bound of the value range.
     * @default 0
     */
    public readonly min = input(0);

    /**
     * @description Border-radius preset applied to the bar.
     * @default medium
     */
    public readonly rounded = input<ProgressBarVariantProps["rounded"]>("medium");

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Current progress value within `[min, max]`.
     * Values outside the range are clamped, for the bar and for `aria-valuenow`; non-finite values count as `min`.
     * @default 0
     */
    public readonly value = input(0);

    public constructor() {
        if (isDevMode()) {
            effect(() => {
                if (!this.indeterminate() && this.ariaRange() === null) {
                    console.warn(`mona-progress-bar: [${this.min()}, ${this.max()}] isn't a valid range.`);
                }
            });
        }
    }
}
