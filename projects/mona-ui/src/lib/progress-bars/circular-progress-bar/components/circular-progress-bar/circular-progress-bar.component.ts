import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, contentChild, inject, input, TemplateRef } from "@angular/core";
import { getPercentage } from "mona-ui/progress-bars/utils/progress-bar.utils";
import { ThemeService } from "mona-ui/theme/services/theme.service";
import { Action } from "../../../../utils/Action";
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
        "[attr.aria-valuemin]": "min()",
        "[attr.aria-valuemax]": "max()",
        "[attr.aria-valuenow]": "progress()",
        "[attr.aria-disabled]": "disabled()",
        "[attr.data-disabled]": "disabled()",
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
        return circularProgressBarBaseThemeVariants(theme)({ disabled });
    });
    protected readonly center = computed(() => {
        return {
            x: computed(() => this.size() / 2),
            y: computed(() => this.size() / 2)
        };
    });
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
     * @description The color of the circular progress bar.
     * Can be a string or a function that takes the current value and returns a string.
     */
    public readonly color = input<string | Action<number, string>>("");

    /**
     * @description Whether the circular progress bar is disabled.
     * @default false
     */
    public readonly disabled = input(false);

    /**
     * @description Whether the circular progress bar is in indeterminate state.
     * @default false
     */
    public readonly indeterminate = input(false);

    /**
     * @description The maximum value of the circular progress bar.
     * @default 100
     */
    public readonly max = input(100);

    /**
     * @description The minimum value of the circular progress bar.
     * @default 0
     */
    public readonly min = input(0);

    /**
     * @description The size of the circular progress bar.
     * @default 100
     */
    public readonly size = input(100);

    /**
     * @description The thickness of the circular progress bar.
     * @default 6
     */
    public readonly thickness = input(6);

    /**
     * @description The value of the circular progress bar.
     * @default 0
     */
    public readonly value = input(0);
}
