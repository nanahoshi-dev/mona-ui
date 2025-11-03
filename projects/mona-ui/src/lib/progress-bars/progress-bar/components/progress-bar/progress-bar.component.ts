import { DecimalPipe, NgTemplateOutlet } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    inject,
    input,
    signal,
} from "@angular/core";
import {
    ProgressBarLabelTemplateDirective
} from "mona-ui/progress-bars/progress-bar/directives/progress-bar-label-template.directive";
import {
    progressBarBaseThemeVariants, progressBarIndeterminateThemeVariants, progressBarLabelThemeVariants,
    progressBarTrackThemeVariants,
    ProgressBarVariantInput,
    ProgressBarVariantProps
} from "mona-ui/progress-bars/progress-bar/styles/progress-bar.styles";
import { getPercentage } from "mona-ui/progress-bars/utils/progress-bar.utils";
import { ThemeService } from "mona-ui/theme/services/theme.service";
import { twMerge } from "tailwind-merge";
import { Action } from "../../../../utils/Action";
import { LabelPosition } from "../../models/LabelPosition";

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
        "[attr.aria-valuemin]": "min()",
        "[attr.aria-valuemax]": "max()",
        "[attr.aria-valuenow]": "progress()",
        "[attr.aria-disabled]": "disabled()",
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
        const rightClip = this.rightClip();
        const progress = this.progress();
        return `inset(-1px ${rightClip}px -1px ${progress}%)`;
    });
    protected readonly prevTrackClipPath = computed(() => {
        const progress = this.progress();
        const indeterminate = this.indeterminate();
        if (indeterminate) {
            return `inset(-1px -1px -1px -1px)`;
        }
        const left = progress < 0 ? 8 : 0;
        const right = progress < 100 ? 8 : 0;
        return `inset(-1px ${right}px -1px ${left}px)`;
    });
    protected readonly progress = computed(() => getPercentage(this.value(), this.min(), this.max()));
    protected readonly rightClip = signal(-1);
    protected readonly trackClasses = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        return progressBarTrackThemeVariants(theme)({ rounded });
    });
    protected readonly trackColor = this.#color;

    /**
     * @description The color of the progress bar.
     * Can be a string or a function that takes the current value and returns a string.
     */
    public readonly color = input<string | Action<number, string>>("");

    /**
     * @description Whether the progress bar is disabled.
     */
    public readonly disabled = input(false);

    /**
     * @description Whether the progress bar is in indeterminate state.
     */
    public readonly indeterminate = input(false);

    /**
     * @description The position of the label.
     * @default center
     */
    public readonly labelPosition = input<LabelPosition>("center");

    /**
     * @description The styles of the label.
     */
    public readonly labelStyles = input<Partial<CSSStyleDeclaration>>({});

    /**
     * @description Whether the label is visible.
     * @default true
     */
    public readonly labelVisible = input(true);

    /**
     * @description The maximum value of the progress bar.
     * @default 100
     */
    public readonly max = input(100);

    /**
     * @description The minimum value of the progress bar.
     * @default 0
     */
    public readonly min = input(0);

    /**
     * @description The border radius of the progress bar.
     * @default medium
     */
    public readonly rounded = input<ProgressBarVariantProps["rounded"]>("medium");

    /**
     * @description The user class of the progress bar.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    /**
     * @description The value of the progress bar.
     * @default 0
     */
    public readonly value = input(0);
}
