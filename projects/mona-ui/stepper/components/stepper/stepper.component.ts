import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    Component,
    computed,
    contentChild,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    model,
    signal,
    Signal,
    TemplateRef
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { select } from "@mirei/ts-collections";
import { fromEvent } from "rxjs";
import { StepperIndicatorTemplateDirective } from "../../directives/stepper-indicator-template.directive";
import { StepperIndicatorDirective } from "../../directives/stepper-indicator.directive";
import { StepperLabelTemplateDirective } from "../../directives/stepper-label-template.directive";
import { StepperStepTemplateDirective } from "../../directives/stepper-step-template.directive";
import type { StepItem, StepOptions } from "../../models/Step";
import type { StepperTemplateContext } from "../../models/StepperTemplateContext";
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
    imports: [NgTemplateOutlet, StepperIndicatorDirective],
    host: {
        role: "group",
        "[attr.aria-label]": "ariaLabel()",
        "[class]": "baseClass()",
        "[style]": "hostStyles()"
    }
})
export class StepperComponent implements StepperVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #hostElementRef = inject(ElementRef);
    readonly #trackItemSize = computed(() => {
        const stepCount = this.viewSteps().length;
        return stepCount !== 0 ? 100 / stepCount : 0;
    });
    readonly #trackLength = computed(() => {
        const step = this.activeStep();
        const stepCount = this.viewSteps().length;
        return step && stepCount > 1 ? `${(100 / (stepCount - 1)) * step.index}%` : "0%";
    });
    protected readonly activeStep = computed(() => {
        const steps = this.viewSteps();
        if (steps.length === 0) {
            return undefined;
        }
        const step = this.step();
        const clampedIndex = Math.min(Math.max(step, 0), steps.length - 1);
        return steps.elementAt(clampedIndex);
    });
    protected readonly baseClass = computed(() => {
        const orientation = this.orientation();
        return stepperBaseThemeVariants({ orientation });
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
        const orientation = this.orientation();
        return stepperStepListThemeVariants({ orientation });
    });
    protected readonly listItemClass = computed(() => {
        const orientation = this.orientation();
        return stepperStepListItemThemeVariants({ orientation });
    });
    protected readonly progressMax = computed(() => Math.max(this.viewSteps().length - 1, 0));
    protected readonly stepTemplate = contentChild(StepperStepTemplateDirective, {
        read: TemplateRef
    }) as Signal<TemplateRef<StepperTemplateContext> | undefined>;
    protected readonly trackClass = computed(() => {
        const orientation = this.orientation();
        return stepperTrackThemeVariants({ orientation });
    });
    protected readonly trackInnerStyles = computed(() => {
        const orientation = this.orientation();
        const length = this.#trackLength();
        return {
            [orientation === "horizontal" ? "width" : "height"]: length
        };
    });
    protected readonly trackItemStyles = computed(() => {
        const orientation = this.orientation();
        const itemSize = this.#trackItemSize();
        return {
            [orientation === "horizontal" ? "maxWidth" : "maxHeight"]: `${itemSize}%`
        };
    });
    protected readonly trackLineClass = computed(() => {
        const orientation = this.orientation();
        return stepperTrackLineThemeVariants({ orientation });
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
            index
        })).toImmutableSet();
    });

    /**
     * @description Sets the accessible label for the stepper group.
     * @default "Progress"
     */
    public readonly ariaLabel = input("Progress", { alias: "aria-label" });

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
     * @description Sets the accessible label for the progress bar element.
     * @default "Step progress"
     */
    public readonly progressAriaLabel = input("Step progress");

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

    protected isStepActive(step: StepItem): boolean {
        const active = this.activeStep();
        return active != null && step.index <= active.index;
    }

    protected isStepLocked(step: StepItem): boolean {
        if (step.options.disabled) {
            return true;
        }
        if (!this.linear()) {
            return false;
        }
        const active = this.activeStep();
        if (!active) {
            return false;
        }
        return Math.abs(step.index - active.index) > 1;
    }

    protected onIndicatorFocus(step: StepItem): void {
        this.setHighlightedStep(step.index);
    }

    protected onStepClick(step: StepItem): void {
        this.setActiveStep(step);
    }

    private moveHighlight(offset: number): void {
        const steps = this.viewSteps();
        const current = this.highlightedStep();
        const linear = this.linear();
        const activeStep = this.activeStep();
        const stepCount = steps.length;
        let target = current + offset;
        const minIndex = linear && activeStep ? Math.max(activeStep.index - 1, 0) : 0;
        const maxIndex = linear && activeStep ? Math.min(activeStep.index + 1, stepCount - 1) : stepCount - 1;
        target = Math.min(Math.max(target, minIndex), maxIndex);
        // Skip over disabled steps in the direction of travel.
        while (target >= 0 && target < stepCount && steps.elementAt(target)?.options.disabled) {
            target += offset;
        }
        if (target >= 0 && target < stepCount) {
            this.setHighlightedStep(target);
        }
    }

    private setActiveStep(step: StepItem): void {
        if (step.options.disabled) {
            return;
        }
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
        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => {
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
