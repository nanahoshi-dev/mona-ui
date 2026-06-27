import { DecimalPipe, NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, contentChild, inject, input } from "@angular/core";

import { twMerge } from "tailwind-merge";
import { ThemeService } from "../../../../theme/services/theme.service";
import { Action } from "../../../../utils/Action";
import { getPercentage } from "../../../utils/progress-bar.utils";
import { ProgressBarLabelTemplateDirective } from "../../directives/progress-bar-label-template.directive";
import { LabelPosition } from "../../models/LabelPosition";
import {
    progressBarBaseThemeVariants,
    progressBarIndeterminateThemeVariants,
    progressBarLabelThemeVariants,
    progressBarTrackThemeVariants,
    ProgressBarVariantInput,
    ProgressBarVariantProps
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
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [DecimalPipe, NgTemplateOutlet],
    host: {
        "[class]": "baseClasses()",
        "[attr.aria-busy]": "indeterminate() || null",
        "[attr.aria-label]": "ariaLabel() || null",
        "[attr.aria-valuemin]": "indeterminate() ? null : min()",
        "[attr.aria-valuemax]": "indeterminate() ? null : max()",
        "[attr.aria-valuenow]": "indeterminate() ? null : value()",
        "[attr.aria-valuetext]": "ariaValueText() || null",
        "[attr.aria-disabled]": "disabled() || null",
        "[attr.data-disabled]": "disabled()",
        role: "progressbar"
    }
})
export class ProgressBarComponent implements ProgressBarVariantInput {
    readonly #color = computed(() => {
        const color = this.color();
        const progress = this.progress();
        return typeof color === "string" ? color : color?.(progress);
    });
    readonly #themeService = inject(ThemeService);
    protected readonly baseClasses = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const classes = progressBarBaseThemeVariants(theme)({ rounded });
        const userClass = this.userClass();
        return twMerge(classes, userClass);
    });
    protected readonly indeterminateClasses = computed(() => {
        const theme = this.#themeService.theme();
        return progressBarIndeterminateThemeVariants(theme)();
    });
    protected readonly labelClasses = computed(() => {
        const theme = this.#themeService.theme();
        return progressBarLabelThemeVariants(theme)();
    });
    protected readonly labelTemplate = contentChild(ProgressBarLabelTemplateDirective);
    protected readonly nextTrackClipPath = computed(() => {
        const progress = this.progress();
        return `inset(-1px -1px -1px ${progress}%)`;
    });
    protected readonly prevTrackClipPath = computed(() => {
        const progress = this.progress();
        const indeterminate = this.indeterminate();
        if (indeterminate) {
            return `inset(-1px -1px -1px -1px)`;
        }
        const right = progress < 100 ? 8 : 0;
        return `inset(-1px ${right}px -1px 0px)`;
    });
    protected readonly progress = computed(() => getPercentage(this.value(), this.min(), this.max()));
    protected readonly trackClasses = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const classes = progressBarTrackThemeVariants(theme)({ rounded });
        return this.animate()
            ? classes
            : twMerge(classes, "data-[next='true']:transition-none data-[prev='true']:transition-none");
    });
    protected readonly trackColor = this.#color;

    /**
     * @description Accessible label for the progress bar host element.
     * Use to describe what is being measured (e.g., "Upload progress").
     * When empty, assistive technology announces the role and numeric values only.
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
     * @description Enables CSS transitions on fill and color changes.
     * Set to `false` when updating `value` at high frequency (e.g., a real-time byte counter).
     * @default true
     */
    public readonly animate = input(true);

    /**
     * @description Fill color of the progress track.
     * Pass a CSS color string, or a function that receives the current percentage (0–100) and returns a color string.
     * When empty, falls back to the primary theme color.
     * @default ""
     */
    public readonly color = input<string | Action<number, string>>("");

    /**
     * @description Renders the bar with reduced visual emphasis and removes pointer interaction.
     * @default false
     */
    public readonly disabled = input(false);

    /**
     * @description Switches to indeterminate mode: plays a looping animation and hides the label.
     * ARIA value attributes are removed and `aria-busy` is set on the host element.
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
     * @description Upper bound of the value range. Must be greater than `min`.
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
     * Values outside the range are clamped before rendering; non-finite values are treated as `0`.
     * @default 0
     */
    public readonly value = input(0);
}
