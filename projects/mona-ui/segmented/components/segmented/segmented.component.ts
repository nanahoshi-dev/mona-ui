import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    afterRenderEffect,
    booleanAttribute,
    Component,
    computed,
    contentChild,
    DestroyRef,
    ElementRef,
    inject,
    input,
    model,
    output,
    signal,
    TemplateRef,
    viewChildren
} from "@angular/core";
import type { FormValueControl } from "@angular/forms/signals";
import { createElementControlId, injectEffectiveDisabled } from "@nanahoshi/mona-ui/internal";
import { twMerge } from "tailwind-merge";
import { SegmentedItemTemplateDirective } from "../../directives/segmented-item-template.directive";
import type { SegmentedIndicatorGeometry } from "../../models/SegmentedIndicatorGeometry";
import type { SegmentedItemTemplateContext } from "../../models/SegmentedItemTemplateContext";
import type { SegmentedOption } from "../../models/SegmentedOption";
import type { SegmentedValue } from "../../models/SegmentedValue";
import {
    segmentedContainerThemeVariants,
    segmentedIndicatorThemeVariants,
    segmentedInputThemeVariants,
    segmentedOptionThemeVariants,
    type SegmentedVariantInput,
    type SegmentedVariantProps
} from "../../styles/segmented.styles";

@Component({
    selector: "mona-segmented",
    templateUrl: "./segmented.component.html",
    imports: [NgTemplateOutlet],
    host: {
        "[attr.aria-disabled]": "effectiveDisabled() || undefined",
        "[attr.aria-invalid]": "invalidState() ? 'true' : null",
        "[attr.aria-label]": "ariaLabel()",
        "[attr.aria-labelledby]": "ariaLabelledBy()",
        "[attr.aria-readonly]": "readonly() || null",
        "[attr.aria-required]": "required() || null",
        "[attr.data-disabled]": "effectiveDisabled()",
        "[attr.data-readonly]": "readonly() || null",
        "(focusout)": "onFocusOut($event)",
        "[attr.data-invalid]": "invalidState() || null",
        "[attr.role]": "'radiogroup'",
        "[class]": "containerClasses()"
    }
})
export class SegmentedComponent<T extends SegmentedValue = SegmentedValue>
    implements SegmentedVariantInput, FormValueControl<T | null>
{
    readonly #destroyRef = inject(DestroyRef);
    readonly #hostElementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    #lastAnimatedIndex: number | null = null;
    #lastOptions: readonly SegmentedOption<T>[] | null = null;
    #lastSize: SegmentedVariantProps["size"] | null = null;
    #observedOptionElements: readonly HTMLLabelElement[] = [];
    #resizeObserver: ResizeObserver | null = null;

    protected readonly containerClasses = computed(() => {
        const classes = segmentedContainerThemeVariants({ alignment: this.alignment(), rounded: this.rounded() });
        return twMerge(classes, this.userClass());
    });
    protected readonly effectiveDisabled = injectEffectiveDisabled(() => this.disabled());
    protected readonly groupName = createElementControlId();
    protected readonly indicatorClasses = computed(() => {
        const animate = this.animate() && this.indicatorTransitionEnabled();
        const rounded = this.rounded();
        return segmentedIndicatorThemeVariants({ animate, rounded });
    });
    protected readonly indicatorGeometry = signal<SegmentedIndicatorGeometry | null>(null);
    protected readonly indicatorInitialized = signal(false);
    protected readonly indicatorTransitionEnabled = signal(false);
    protected readonly inputClasses = computed(() => segmentedInputThemeVariants());
    protected readonly invalidState = computed(() => this.touched() && this.invalid());
    protected readonly itemTemplate = contentChild(SegmentedItemTemplateDirective, { read: TemplateRef });
    protected readonly optionClasses = computed(() => {
        const alignment = this.alignment();
        const rounded = this.rounded();
        const size = this.size();
        return segmentedOptionThemeVariants({ alignment, rounded, size });
    });
    protected readonly optionElements = viewChildren<ElementRef<HTMLLabelElement>>("optionElement");
    protected readonly selectedIndex = computed(() => {
        const value = this.value();
        return this.options().findIndex(option => option.value === value);
    });
    protected readonly selectedOptionDisabled = computed(() => {
        const selectedIndex = this.selectedIndex();
        if (selectedIndex === -1) {
            return false;
        }
        const option = this.options()[selectedIndex];
        return this.effectiveDisabled() || !!option?.disabled;
    });

    /**
     * @description Controls the alignment of the items inside the segmented component.
     * @default "stretch"
     */
    public readonly alignment = input<SegmentedVariantProps["alignment"]>("stretch");

    /**
     * @description Controls whether the selection indicator animates between selected options.
     * When false, selection changes are applied immediately without transition.
     * @default true
     */
    public readonly animate = input(true, { transform: booleanAttribute });

    /**
     * @description Accessible name for the radio group. Provide either `aria-label` or `aria-labelledby`.
     * @default null
     */
    public readonly ariaLabel = input<string | null>(null, { alias: "aria-label" });

    /**
     * @description ID of an external element that provides the accessible name for the radio group.
     * @default null
     */
    public readonly ariaLabelledBy = input<string | null>(null, { alias: "aria-labelledby" });

    /**
     * @description Disables every option in the group and prevents value changes.
     * @default false
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description Marks the component as invalid. Error styling requires both `invalid` and `touched` to be `true`.
     * When bound to a signal form field via `[formField]`, this is written by the signal forms `Field` directive.
     * @default false
     */
    public readonly invalid = input(false, { transform: booleanAttribute });

    /**
     * @description The list of selectable options. Exactly one option is selected at a time.
     */
    public readonly options = input.required<readonly SegmentedOption<T>[]>();

    /**
     * @description Prevents value changes while the control stays focusable and readable. When bound to a signal form
     * field via `[formField]`, this is written by the `FormField` directive.
     * @default false
     */
    public readonly readonly = input(false, { transform: booleanAttribute });

    /**
     * @description Marks the group as required, as `aria-required`. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly required = input(false, { transform: booleanAttribute });

    /**
     * @description Border-radius preset applied to the segmented container and its options.
     * @default "medium"
     */
    public readonly rounded = input<SegmentedVariantProps["rounded"]>("medium");

    /**
     * @description Size preset controlling the height, horizontal padding, text size, and spacing of each option.
     * @default "medium"
     */
    public readonly size = input<SegmentedVariantProps["size"]>("medium");

    /**
     * @description Emitted when the selected value changes or focus leaves the group.
     */
    public readonly touch = output<void>();

    /**
     * @description Marks the component as touched. When bound to a signal form field via `[formField]`,
     * this is written by the signal forms `Field` directive.
     * @default false
     */
    public readonly touched = input(false, { transform: booleanAttribute });

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * @description The currently selected value. When it matches no current option, no option is checked.
     * A `null` value is allowed initially but cannot be restored through segmented interaction.
     * @default null
     */
    public readonly value = model<T | null>(null);

    public constructor() {
        afterRenderEffect({
            read: () => {
                this.selectedIndex();
                const optionElements = this.optionElements();
                this.alignment();
                this.rounded();
                this.animate();

                const size = this.size();
                const options = this.options();
                const isSizeChange = this.#lastSize !== null && this.#lastSize !== size;
                const isOptionsChange = this.#lastOptions !== null && this.#lastOptions !== options;
                const suppressTransition = isSizeChange || isOptionsChange;

                this.#lastSize = size;
                this.#lastOptions = options;
                this.observeOptionElements(optionElements);
                this.updateIndicatorGeometry({ suppressTransition });
            }
        });

        afterNextRender({
            read: () => {
                this.setupResizeObserver();
            }
        });

        this.#destroyRef.onDestroy(() => {
            this.#resizeObserver?.disconnect();
        });
    }

    /**
     * @description Moves focus to the selected option, or the first enabled one.
     * @param options Options passed to the native `focus()` call, such as `preventScroll`.
     */
    public focus(options?: FocusOptions): void {
        const host = this.#hostElementRef.nativeElement;
        const target =
            host.querySelector<HTMLInputElement>("input:checked:not(:disabled)") ??
            host.querySelector<HTMLInputElement>("input:not(:disabled)");
        target?.focus(options);
    }

    protected createOptionContext(option: SegmentedOption<T>, index: number): SegmentedItemTemplateContext<T> {
        return {
            $implicit: option,
            disabled: this.effectiveDisabled() || !!option.disabled,
            index,
            option,
            selected: option.value === this.value()
        };
    }

    protected onFocusOut(event: FocusEvent): void {
        const nextTarget = event.relatedTarget;
        if (nextTarget instanceof Node && this.#hostElementRef.nativeElement.contains(nextTarget)) {
            return;
        }
        this.touch.emit();
    }

    protected onOptionChange(option: SegmentedOption<T>): void {
        if (this.effectiveDisabled() || this.readonly() || option.disabled) {
            return;
        }
        this.value.set(option.value);
        this.touch.emit();
    }

    protected onOptionClick(event: Event): void {
        // Canceling the click makes the browser restore the previously checked option.
        if (this.readonly()) {
            event.preventDefault();
        }
    }

    private observeOptionElements(optionElements: readonly ElementRef<HTMLLabelElement>[]): void {
        if (!this.#resizeObserver) {
            return;
        }

        const elements = optionElements.map(optionElement => optionElement.nativeElement);
        for (const element of this.#observedOptionElements) {
            if (!elements.includes(element)) {
                this.#resizeObserver.unobserve(element);
            }
        }
        for (const element of elements) {
            if (!this.#observedOptionElements.includes(element)) {
                this.#resizeObserver.observe(element);
            }
        }
        this.#observedOptionElements = elements;
    }

    private setupResizeObserver(): void {
        if (typeof ResizeObserver === "undefined") {
            return;
        }
        this.#resizeObserver = new ResizeObserver(() => {
            this.updateIndicatorGeometry({ suppressTransition: true });
        });
        this.#resizeObserver.observe(this.#hostElementRef.nativeElement);
        this.observeOptionElements(this.optionElements());
    }

    private updateIndicatorGeometry(options?: { suppressTransition?: boolean }): void {
        const selectedIndex = this.selectedIndex();
        if (selectedIndex === -1) {
            this.#lastAnimatedIndex = null;
            this.indicatorGeometry.set(null);
            this.indicatorTransitionEnabled.set(false);
            return;
        }

        const optionElements = this.optionElements();
        const selectedElementRef = optionElements[selectedIndex];
        if (!selectedElementRef?.nativeElement) {
            this.#lastAnimatedIndex = null;
            this.indicatorGeometry.set(null);
            this.indicatorTransitionEnabled.set(false);
            return;
        }

        const option = selectedElementRef.nativeElement;

        // `offsetLeft`/`offsetTop`/`offsetWidth`/`offsetHeight` are pure layout values, relative to
        // the nearest positioned ancestor (the host, which is `position: relative` and the option's
        // direct parent). Unlike `getBoundingClientRect()`, they are unaffected by any CSS transform
        // an ancestor applies — e.g. the scale animation `mona-popup` plays while opening. Measuring
        // with `getBoundingClientRect()` there could capture a mid-transition (e.g. 95%-scaled)
        // snapshot that never gets corrected once the animation settles, undersizing/misplacing the
        // indicator relative to the option's real, final box.
        const x = option.offsetLeft;
        const y = option.offsetTop;
        const width = option.offsetWidth;
        const height = option.offsetHeight;

        const shouldAnimate =
            !options?.suppressTransition &&
            this.animate() &&
            this.indicatorInitialized() &&
            this.#lastAnimatedIndex !== null &&
            this.#lastAnimatedIndex !== selectedIndex;

        this.indicatorTransitionEnabled.set(shouldAnimate);

        this.indicatorGeometry.set({
            height,
            transform: `translate3d(${x}px, ${y}px, 0)`,
            width
        });

        this.#lastAnimatedIndex = selectedIndex;

        if (!this.indicatorInitialized()) {
            this.indicatorInitialized.set(true);
        }
    }
}
