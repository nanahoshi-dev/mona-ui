import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    effect,
    ElementRef,
    inject,
    input,
    model,
    signal,
    Signal,
    TemplateRef
} from "@angular/core";
import { select } from "@mirei/ts-collections";
import { fromEvent } from "rxjs";
import { v4 } from "uuid";
import { ThemeService } from "../../../../theme/services/theme.service";
import { StepperIndicatorTemplateDirective } from "../../directives/stepper-indicator-template.directive";
import { StepperIndicatorDirective } from "../../directives/stepper-indicator.directive";
import { StepperLabelTemplateDirective } from "../../directives/stepper-label-template.directive";
import { StepperStepTemplateDirective } from "../../directives/stepper-step-template.directive";
import { StepItem, StepOptions } from "../../models/Step";
import { StepperTemplateContext } from "../../models/StepperTemplateContext";
import { ActiveStepPipe } from "../../pipes/active-step.pipe";
import {
    stepperBaseThemeVariants,
    stepperStepListItemThemeVariants,
    stepperStepListThemeVariants,
    stepperTrackLineThemeVariants,
    stepperTrackThemeVariants,
    StepperVariantInput,
    StepperVariantProps
} from "../../styles/stepper.styles";

@Component({
    selector: "mona-stepper",
    templateUrl: "./stepper.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgTemplateOutlet, StepperIndicatorDirective, ActiveStepPipe],
    host: {
        "[class]": "baseClass()",
        "[style]": "hostStyles()"
    }
})
export class StepperComponent implements StepperVariantInput {
    readonly #hostElementRef = inject(ElementRef);
    readonly #themeService = inject(ThemeService);
    readonly #trackItemSize = computed(() => {
        const stepCount = this.viewSteps().length;
        return stepCount !== 0 ? 100 / stepCount : 0;
    });
    readonly #trackLength = computed(() => {
        const step = this.activeStep();
        return step ? `${(100 / (this.viewSteps().length - 1)) * step.index}%` : "0%";
    });
    protected readonly activeStep = computed(() => {
        const step = this.step();
        return this.viewSteps().elementAt(step);
    });
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const orientation = this.orientation();
        return stepperBaseThemeVariants(theme)({ orientation });
    });
    protected readonly highlightedStep = signal<number>(0);
    protected readonly hostStyles = computed(() => {
        const orientation = this.orientation();
        const stepCount = this.viewSteps().length;
        return {
            gridTemplateColumns: orientation === "horizontal" ? `repeat(${stepCount * 2}, 1fr)` : undefined,
            gridTemplateRows: orientation === "vertical" ? `repeat(${stepCount * 2}, 1fr)` : undefined
        };
    });
    protected readonly indicatorTemplate = contentChild(StepperIndicatorTemplateDirective, {
        read: TemplateRef
    }) as Signal<TemplateRef<StepperTemplateContext> | undefined>;
    protected readonly labelTemplate = contentChild(StepperLabelTemplateDirective, { read: TemplateRef }) as Signal<
        TemplateRef<StepperTemplateContext> | undefined
    >;
    protected readonly listClass = computed(() => {
        const theme = this.#themeService.theme();
        const orientation = this.orientation();
        return stepperStepListThemeVariants(theme)({ orientation });
    });
    protected readonly listItemClass = computed(() => {
        const theme = this.#themeService.theme();
        const orientation = this.orientation();
        return stepperStepListItemThemeVariants(theme)({ orientation });
    });
    protected readonly stepTemplate = contentChild(StepperStepTemplateDirective, {
        read: TemplateRef
    }) as Signal<TemplateRef<StepperTemplateContext> | undefined>;
    protected readonly trackInnerStyles = computed(() => {
        const orientation = this.orientation();
        const length = this.#trackLength();
        return {
            [orientation === "horizontal" ? "width" : "height"]: length
        };
    });
    protected readonly trackClass = computed(() => {
        const theme = this.#themeService.theme();
        const orientation = this.orientation();
        return stepperTrackThemeVariants(theme)({ orientation });
    });
    protected readonly trackItemStyles = computed(() => {
        const orientation = this.orientation();
        const itemSize = this.#trackItemSize();
        return {
            [orientation === "horizontal" ? "maxWidth" : "maxHeight"]: `${itemSize}%`
        };
    });
    protected readonly trackLineClass = computed(() => {
        const theme = this.#themeService.theme();
        const orientation = this.orientation();
        return stepperTrackLineThemeVariants(theme)({ orientation });
    });
    protected readonly trackStyles = computed(() => {
        const orientation = this.orientation();
        const step = this.activeStep();
        const stepCount = this.viewSteps().length;
        const gridColumn = orientation === "horizontal" && step != null ? `2/${stepCount * 2}` : undefined;
        const gridRow = orientation === "vertical" && step != null ? `2/${stepCount * 2}` : undefined;
        return { gridColumn, gridRow };
    });
    protected readonly viewSteps = computed(() => {
        const steps = this.steps();
        return select<StepOptions, StepItem>(steps, (step, index) => ({
            options: step,
            index,
            uid: v4()
        })).toImmutableSet();
    });

    /**
     * @description Sets the flow of the stepper.
     * If set to true, the user will only be able to navigate to the previous or the next step.
     * @default true
     */
    public readonly linear = input(true);

    /**
     * @description Sets the orientation of the stepper.
     */
    public readonly orientation = input<StepperVariantProps["orientation"]>("horizontal");

    /**
     * @description Sets the roundness of the stepper steps.
     */
    public readonly rounded = input<StepperVariantProps["rounded"]>("full");

    /**
     * @description Sets the active step of the stepper.
     */
    public readonly step = model(0);

    /**
     * @description Sets the steps of the stepper.
     */
    public readonly steps = input<Iterable<StepOptions>>([]);

    public constructor() {
        effect(() => {
            const activeIndex = this.step();
            const stepCount = this.viewSteps().length;
            if (stepCount === 0) {
                return;
            }
            const clampedIndex = Math.min(Math.max(activeIndex, 0), stepCount - 1);
            this.highlightedStep.set(clampedIndex);
        });
        afterNextRender({
            read: () => this.setKeyboardEvents()
        });
    }

    protected onStepClick(step: StepItem): void {
        this.setActiveStep(step);
    }

    protected onIndicatorFocus(step: StepItem): void {
        this.setHighlightedStep(step.index);
    }

    private moveHighlight(offset: number): void {
        const current = this.highlightedStep();
        this.setHighlightedStep(current + offset);
    }

    private setActiveStep(step: StepItem): void {
        const linear = this.linear();
        const activeStep = this.activeStep();
        const isPreviousStep = activeStep && activeStep.index - 1 === step.index;
        const isNextStep = activeStep && activeStep.index + 1 === step.index;
        if (!linear || (activeStep && (isPreviousStep || isNextStep))) {
            this.step.set(step.index);
            this.highlightedStep.set(step.index);
        }
    }

    private setHighlightedStep(index: number): void {
        const stepCount = this.viewSteps().length;
        if (stepCount === 0) {
            return;
        }
        const clampedIndex = Math.min(Math.max(index, 0), stepCount - 1);
        this.highlightedStep.set(clampedIndex);
    }

    private setKeyboardEvents(): void {
        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown").subscribe(event => {
            const orientation = this.orientation();
            const previousKey = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
            const nextKey = orientation === "vertical" ? "ArrowDown" : "ArrowRight";
            if (event.key === previousKey) {
                event.preventDefault();
                this.moveHighlight(-1);
            } else if (event.key === nextKey) {
                event.preventDefault();
                this.moveHighlight(1);
            } else if (event.key === "Home") {
                event.preventDefault();
                this.setHighlightedStep(0);
            } else if (event.key === "End") {
                event.preventDefault();
                this.setHighlightedStep(this.viewSteps().length - 1);
            } else if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                const highlightedStep = this.highlightedStep();
                const step = this.viewSteps().elementAt(highlightedStep);
                if (step) {
                    this.setActiveStep(step);
                }
            }
        });
    }
}
