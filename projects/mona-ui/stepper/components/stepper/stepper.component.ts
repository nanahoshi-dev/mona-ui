import { NgTemplateOutlet } from "@angular/common";
import type { ElementRef, Signal } from "@angular/core";
import {
    booleanAttribute,
    Component,
    computed,
    contentChild,
    effect,
    inject,
    input,
    model,
    output,
    signal,
    TemplateRef,
    viewChildren
} from "@angular/core";
import { LucideCheck, LucideCircleAlert } from "@lucide/angular";
import { select } from "@mirei/ts-collections";
import { formatNumber, injectComponentDirection, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import { StepperIndicatorTemplateDirective } from "../../directives/stepper-indicator-template.directive";
import { StepperIndicatorDirective } from "../../directives/stepper-indicator.directive";
import { StepperLabelTemplateDirective } from "../../directives/stepper-label-template.directive";
import { StepperStepTemplateDirective } from "../../directives/stepper-step-template.directive";
import { STEPPER_DEFAULT_MESSAGES } from "../../i18n/stepper.default-messages";
import type { StepItem, StepOptions, StepState } from "../../models/Step";
import type { StepperTemplateContext } from "../../models/StepperTemplateContext";
import { StepSelectEvent } from "../../models/StepSelectEvent";
import type { StepperVariantInput, StepperVariantProps } from "../../styles/stepper.styles";
import {
    stepperBaseThemeVariants,
    stepperStepButtonThemeVariants,
    stepperStepLabelThemeVariants,
    stepperStepListItemThemeVariants,
    stepperStepListThemeVariants,
    stepperTrackLineThemeVariants,
    stepperTrackThemeVariants
} from "../../styles/stepper.styles";

/** What in a label or step template keeps its own clicks. */
const PROJECTED_CONTROL_SELECTOR = "a[href], button, input, select, summary, textarea, [contenteditable], [tabindex]";

@Component({
    selector: "mona-stepper",
    templateUrl: "./stepper.component.html",
    imports: [NgTemplateOutlet, StepperIndicatorDirective, LucideCheck, LucideCircleAlert],
    host: {
        role: "group",
        "[attr.aria-label]": "ariaLabel() || messages().stepper",
        "[class]": "baseClass()",
        "[style]": "hostStyles()",
        "(keydown)": "onKeydown($event)"
    }
})
export class StepperComponent implements StepperVariantInput {
    /** The nearest steps on either side of the current one that aren't disabled: all that a linear stepper can reach. */
    readonly #adjacentEnabledSteps = computed(() => {
        const active = this.activeStep();
        const enabled = this.viewSteps()
            .toArray()
            .filter(step => !step.options.disabled);
        if (!active) {
            return { next: undefined, previous: undefined };
        }
        return {
            next: enabled.find(step => step.index > active.index),
            previous: enabled.filter(step => step.index < active.index).pop()
        };
    });
    readonly #direction = injectComponentDirection();
    readonly #i18n = inject(MonaI18nService);
    readonly #id = createElementControlId();
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
        return steps.elementAt(this.normalizeIndex(this.step(), steps.length));
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
    protected readonly isRtl = computed(() => this.#direction() === "rtl");
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
    protected readonly messages = this.#i18n.componentMessages("stepper", STEPPER_DEFAULT_MESSAGES);
    protected readonly progressMax = computed(() => Math.max(this.viewSteps().length - 1, 0));
    protected readonly progressText = computed(() => {
        const active = this.activeStep();
        return active ? this.positionText(active.index + 1) : null;
    });
    protected readonly stepButtonClass = computed(() => {
        return stepperStepButtonThemeVariants();
    });
    protected readonly stepButtons = viewChildren<ElementRef<HTMLButtonElement>>("stepButton");
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
        // Each step takes an equal share, with its indicator centred in it along the track. Across it, the 2rem
        // indicator's centre is 1rem in, and the 0.5rem track is centred on that.
        const edge = `${this.#trackItemSize() / 2}%`;
        return this.orientation() === "horizontal"
            ? { insetInlineEnd: edge, insetInlineStart: edge, top: "0.75rem" }
            : { bottom: edge, insetInlineStart: "0.75rem", top: edge };
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
     * @default ""
     */
    public readonly ariaLabel = input<string>("", { alias: "aria-label" });

    /**
     * @description Sets the flow of the stepper.
     * If set to true, the user will only be able to navigate to the previous or the next step.
     * @default true
     */
    public readonly linear = input(true, { transform: booleanAttribute });

    /**
     * @description Sets the orientation of the stepper.
     */
    public readonly orientation = input<StepperVariantProps["orientation"]>("horizontal");

    /**
     * @description Sets the accessible label for the progress bar element.
     * @default ""
     */
    public readonly progressAriaLabel = input<string>("");

    /**
     * @description Sets the roundness of the stepper steps.
     */
    public readonly rounded = input<StepperVariantProps["rounded"]>("full");

    /**
     * @description Sets the active step of the stepper.
     */
    public readonly step = model(0);

    /**
     * @description Emitted before a click or key changes the step. Call `preventDefault()` to stay on the current step,
     * for example while its form is invalid. It doesn't fire when `step` is written from outside.
     */
    public readonly stepSelect = output<StepSelectEvent>();

    /**
     * @description Sets the steps of the stepper.
     */
    public readonly steps = input<Iterable<StepOptions>>([]);

    public constructor() {
        effect(() => {
            const requested = this.step();
            const stepCount = this.viewSteps().length;
            if (stepCount === 0) {
                return; // Steps may still be on their way, so the value can't be judged yet.
            }
            const index = this.normalizeIndex(requested, stepCount);
            if (index !== requested) {
                this.step.set(index);
            }
            this.highlightedStep.set(index);
        });
    }

    protected descriptionId(step: StepItem): string {
        return `${this.#id}-${step.index}-description`;
    }

    protected formatStepNumber(value: number): string {
        if (value == null) {
            return "";
        }
        return formatNumber(value, this.#i18n.localeId(), {
            maximumFractionDigits: 0,
            useGrouping: false
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
        if (!active || step.index === active.index) {
            return false;
        }
        const { next, previous } = this.#adjacentEnabledSteps();
        return step.index !== next?.index && step.index !== previous?.index;
    }

    protected labelClass(state: StepState): string {
        return stepperStepLabelThemeVariants({ state });
    }

    protected onIndicatorFocus(step: StepItem): void {
        this.highlightedStep.set(step.index);
    }

    /**
     * Enter and Space aren't here: they reach the step as the click a native button makes of them. Only the step buttons'
     * own keys count, so a control in a template keeps its arrows, and a modified key stays the browser's.
     */
    protected onKeydown(event: KeyboardEvent): void {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
            return;
        }
        if (!this.stepButtons().some(button => button.nativeElement === event.target)) {
            return;
        }
        const orientation = this.orientation();
        const isRtl = this.isRtl();
        let previousKey = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
        let nextKey = orientation === "vertical" ? "ArrowDown" : "ArrowRight";
        if (orientation === "horizontal" && isRtl) {
            previousKey = "ArrowRight";
            nextKey = "ArrowLeft";
        }
        const reachable = this.viewSteps()
            .toArray()
            .filter(step => !this.isStepLocked(step));
        const current = this.highlightedStep();
        let target: StepItem | undefined;
        if (event.key === previousKey) {
            target = reachable.filter(step => step.index < current).pop();
        } else if (event.key === nextKey) {
            target = reachable.find(step => step.index > current);
        } else if (event.key === "Home") {
            target = reachable[0];
        } else if (event.key === "End") {
            target = reachable[reachable.length - 1];
        } else {
            return;
        }
        event.preventDefault();
        if (target) {
            this.highlightedStep.set(target.index);
            this.stepButtons()[target.index]?.nativeElement.focus();
        }
    }

    protected onStepClick(step: StepItem, event: MouseEvent): void {
        const control = (event.target as Element).closest(PROJECTED_CONTROL_SELECTOR);
        if (control && !this.stepButtons().some(button => button.nativeElement === control)) {
            return;
        }
        this.setActiveStep(step, event);
    }

    protected positionText(position: number): string {
        return this.messages().stepPosition(position, this.viewSteps().length);
    }

    protected stepState(step: StepItem): StepState {
        const active = this.activeStep();
        if (step.index === active?.index) {
            return "current";
        }
        if (step.options.disabled) {
            return "disabled";
        }
        return (step.options.completed ?? (active != null && step.index < active.index)) ? "completed" : "upcoming";
    }

    private normalizeIndex(value: number, stepCount: number): number {
        return Number.isFinite(value) ? Math.min(Math.max(Math.trunc(value), 0), stepCount - 1) : 0;
    }

    private setActiveStep(step: StepItem, event: Event): void {
        const active = this.activeStep();
        if (this.isStepLocked(step) || step.index === active?.index) {
            return;
        }
        const selectEvent = new StepSelectEvent(step.index, active?.index ?? 0, step.options, event);
        this.stepSelect.emit(selectEvent);
        if (selectEvent.isDefaultPrevented()) {
            return;
        }
        this.step.set(step.index);
        this.highlightedStep.set(step.index);
    }
}
