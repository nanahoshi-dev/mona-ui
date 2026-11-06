import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, ElementRef, input, model, Signal, signal, viewChild } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { type FormValueControl } from "@angular/forms/signals";
import { filter, fromEvent, tap } from "rxjs";
import { LabelStylePipe } from "../../pipes/label-style.pipe";
import { TickStylePipe } from "../../pipes/tick-style.pipe";
import { SLIDER_DEFAULT_MESSAGES } from "../../i18n/slider.default-messages";
import { SliderBaseComponent } from "../slider-base/slider-base.component";

@Component({
    selector: "mona-slider",
    templateUrl: "./slider.component.html",
    imports: [NgTemplateOutlet, LabelStylePipe, TickStylePipe],
    host: {
        // The ARIA inputs are applied to the handle, so the host must not keep the static attributes.
        "[attr.aria-describedby]": "null",
        "[attr.aria-label]": "null",
        "[attr.aria-labelledby]": "null",
        "[class]": "baseClasses()",
        "[class.mona-slider]": "true",
        "[attr.data-disabled]": "effectiveDisabled() || null",
        "[attr.data-orientation]": "orientation()",
        "[attr.data-readonly]": "readonly() || null"
    }
})
export class SliderComponent extends SliderBaseComponent implements FormValueControl<number> {
    protected readonly computedAriaLabel = computed(
        () => this.ariaLabel() ?? (this.labelledBy() ? null : this.messages().sliderValue)
    );
    protected readonly handleFocused = signal(false);
    protected readonly handlePosition = computed(() => this.positionFromValue(this.normalizedValue()));
    protected readonly handleStyle = computed<Partial<CSSStyleDeclaration>>(() => ({
        ...this.handleTemplateStyles(),
        ...this.handleStyles()
    }));
    protected readonly messages = this.i18n.componentMessages("slider", SLIDER_DEFAULT_MESSAGES);
    protected readonly normalizedValue = computed(() => this.snapValue(this.value()));
    protected readonly selectionLeft = computed(() => 0);
    protected readonly selectionRight = computed(() => this.handlePosition());
    protected readonly sliderHandle: Signal<ElementRef<HTMLDivElement>> = viewChild.required("sliderHandle");
    protected readonly valueIsShown = computed(() => this.normalizedValue() === this.value());

    /**
     * @description Upper bound that wins over `maxValue`. When bound to a signal form field via `[formField]`, this is
     * written from the field's `max` rule.
     * @default undefined
     */
    public readonly max = input<number | undefined>(undefined);

    /**
     * @description Lower bound that wins over `minValue`. When bound to a signal form field via `[formField]`, this is
     * written from the field's `min` rule.
     * @default undefined
     */
    public readonly min = input<number | undefined>(undefined);

    /**
     * @description Current value. A value out of range or off the step grid is shown at the nearest valid value, and
     * the model keeps its own until the user changes it, so a `maxValue` that loads late can't overwrite saved data. A
     * development warning reports it.
     * @default 0
     */
    public readonly value = model(0);

    public focus(options?: FocusOptions): void {
        if (!this.effectiveDisabled()) {
            this.sliderHandle().nativeElement.focus(options);
        }
    }

    protected override getMaxOverride(): number | undefined {
        return this.max();
    }

    protected override getMinOverride(): number | undefined {
        return this.min();
    }

    protected handleHandleMove(event: PointerEvent): void {
        this.updateValue(this.getValueFromPointerEvent(event));
    }

    protected override setSubscriptions(): void {
        this.setClickSubscription();
        this.setKeydownSubscription();
        this.setPointerMoveSubscription();
        this.setFocusSubscription();
    }

    private setClickSubscription(): void {
        fromEvent<PointerEvent>(this.hostElementRef.nativeElement, "click")
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                tap(() => this.dragging.set(false)),
                filter(() => !this.interactionDisabled())
            )
            .subscribe((event: PointerEvent) => {
                const handle = this.sliderHandle().nativeElement;
                // A drag ends with a click on the handle, and the drag has already placed the value.
                if (!handle.contains(event.target as Node)) {
                    this.handleHandleMove(event);
                }
                handle.focus({ preventScroll: true });
            });
    }

    private setFocusSubscription(): void {
        fromEvent(this.sliderHandle().nativeElement, "focus")
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.zone.run(() => this.handleFocused.set(true)));

        fromEvent(this.sliderHandle().nativeElement, "blur")
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.zone.run(() => {
                    this.handleFocused.set(false);
                    this.touch.emit();
                });
            });
    }

    private setKeydownSubscription(): void {
        fromEvent<KeyboardEvent>(this.sliderHandle().nativeElement, "keydown")
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                filter(() => !this.interactionDisabled()),
                filter(event => this.isNavigationKey(event)),
                tap(event => {
                    event.preventDefault();
                    event.stopPropagation();
                })
            )
            .subscribe(event => this.updateValue(this.calculateNewValue(this.normalizedValue(), event)));
    }

    private setPointerMoveSubscription(): void {
        this.trackHandleDrag(this.sliderHandle().nativeElement, () => event => this.handleHandleMove(event));
    }

    private updateValue(value: number): void {
        const nextValue = this.snapValue(value);
        if (nextValue === this.normalizedValue()) {
            return;
        }
        this.zone.run(() => this.value.set(nextValue));
    }
}
