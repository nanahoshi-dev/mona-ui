import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, contentChild, inject, input } from "@angular/core";
import { twMerge } from "tailwind-merge";
import { ThemeService } from "../../../../theme/services/theme.service";
import { Action } from "../../../../utils/Action";
import { getPercentage } from "../../../utils/progress-bar.utils";
import { CircularProgressBarLabelTemplateDirective } from "../../directives/circular-progress-bar-label-template.directive";
import {
    circularProgressBarBaseThemeVariants,
    type CircularProgressBarBaseVariantInput
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
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgTemplateOutlet],
    host: {
        "[class]": "baseClasses()",
        "[attr.aria-busy]": "indeterminate() || null",
        "[attr.aria-label]": "ariaLabel() || null",
        "[attr.aria-valuemin]": "indeterminate() ? null : min()",
        "[attr.aria-valuemax]": "indeterminate() ? null : max()",
        "[attr.aria-valuenow]": "indeterminate() ? null : value()",
        "[attr.aria-valuetext]": "ariaValueText() || null",
        "[attr.aria-disabled]": "disabled() || null",
        "[attr.data-disabled]": "disabled() || null",
        role: "progressbar",
        "[style.width]": "pixelSize()",
        "[style.height]": "pixelSize()"
    }
})
export class CircularProgressBarComponent implements CircularProgressBarBaseVariantInput {
    readonly #themeService = inject(ThemeService);
    protected readonly baseClasses = computed(() => {
        const theme = this.#themeService.theme();
        const disabled = this.disabled();
        const classes = circularProgressBarBaseThemeVariants(theme)({ disabled });
        const animateClass = this.animate() ? "" : "[&_svg_circle]:transition-none";
        return twMerge(classes, this.userClass(), animateClass);
    });
    protected readonly center = computed(() => ({
        x: this.size() / 2,
        y: this.size() / 2
    }));
    protected readonly circumference = computed(() => 2 * Math.PI * (this.size() / 2 - this.thickness()));
    protected readonly labelTemplate = contentChild(CircularProgressBarLabelTemplateDirective);
    protected readonly pixelSize = computed(() => `${this.size()}px`);
    protected readonly progress = computed(() => getPercentage(this.value(), this.min(), this.max()));
    protected readonly radius = computed(() => this.size() / 2 - this.thickness());
    protected readonly strokeColor = computed(() => {
        if (typeof this.color() === "string") {
            return this.color() || "var(--color-primary)";
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
     * When empty, assistive technology announces the role without a label.
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
     * ARIA value attributes are removed and `aria-busy` is set on the host element.
     * @default false
     */
    public readonly indeterminate = input(false);

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
     * @description Current progress value within `[min, max]`. Values outside the range are clamped before rendering; non-finite values are treated as `0`.
     * @default 0
     */
    public readonly value = input(0);
}
