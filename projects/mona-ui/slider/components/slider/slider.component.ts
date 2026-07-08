import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, ElementRef, input, model, Signal, signal, viewChild } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { type FormValueControl } from "@angular/forms/signals";
import { filter, fromEvent, switchMap, takeUntil, tap } from "rxjs";
import { SliderTickDirective } from "../../directives/slider-tick.directive";
import { LabelStylePipe } from "../../pipes/label-style.pipe";
import { TickStylePipe } from "../../pipes/tick-style.pipe";
import { SliderBaseComponent } from "../slider-base/slider-base.component";

@Component({
    selector: "mona-slider",
    templateUrl: "./slider.component.html",
    imports: [NgTemplateOutlet, SliderTickDirective, LabelStylePipe, TickStylePipe],
    host: {
        "[class]": "baseClasses()",
        "[class.mona-slider]": "true",
        "[attr.data-disabled]": "effectiveDisabled() || null",
        "[attr.data-orientation]": "orientation()",
        "(focus)": "focus()"
    }
})
export class SliderComponent extends SliderBaseComponent implements FormValueControl<number> {
    protected readonly handleFocused = signal(false);
    protected readonly handlePosition = computed(() => this.positionFromValue(this.normalizedValue()));
    protected readonly handleStyle = computed<Partial<CSSStyleDeclaration>>(() => ({
        ...this.handleTemplateStyles(),
        ...this.handleStyles()
    }));
    protected readonly normalizedValue = computed(() => this.snapValue(this.value()));
    protected readonly selectionLeft = computed(() => 0);
    protected readonly selectionRight = computed(() => this.handlePosition());
    protected readonly sliderHandle: Signal<ElementRef<HTMLDivElement>> = viewChild.required("sliderHandle");

    /**
     * @description Accessible name for the host element. Describe what the component represents.
     * When empty, assistive technology announces the role without a label.
     * @default "Slider value"
     */
    public readonly ariaLabel = input<string | null>("Slider value", { alias: "aria-label" });

    /**
     * @description ID of an external element that provides the accessible name for the host element.
     * @default null
     */
    public readonly ariaLabelledBy = input<string | null>(null, { alias: "aria-labelledby" });

    /**
     * @description Current value. Values outside `[minValue, maxValue]` are clamped before rendering.
     * @default 0
     */
    public readonly value = model(0);

    public focus(options?: FocusOptions): void {
        if (!this.effectiveDisabled()) {
            this.sliderHandle().nativeElement.focus(options);
        }
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
                filter(() => !this.effectiveDisabled())
            )
            .subscribe((event: PointerEvent) => this.handleHandleMove(event));
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
                filter(() => !this.effectiveDisabled()),
                filter(event => this.isNavigationKey(event)),
                tap(event => {
                    event.preventDefault();
                    event.stopPropagation();
                })
            )
            .subscribe(event => this.updateValue(this.calculateNewValue(this.normalizedValue(), event)));
    }

    private setPointerMoveSubscription(): void {
        const pointerMove$ = fromEvent<PointerEvent>(document, "pointermove");
        const pointerUp$ = fromEvent<PointerEvent>(document, "pointerup");

        fromEvent<PointerEvent>(this.sliderHandle().nativeElement, "pointerdown")
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                filter(() => !this.effectiveDisabled()),
                tap(() => this.dragging.set(true)),
                switchMap(() =>
                    pointerMove$.pipe(
                        tap((event: PointerEvent) => this.handleHandleMove(event)),
                        takeUntil(pointerUp$.pipe(tap(() => this.zone.run(() => this.dragging.set(false)))))
                    )
                )
            )
            .subscribe();
    }

    private updateValue(value: number): void {
        const nextValue = this.snapValue(value);
        if (nextValue === this.normalizedValue()) {
            return;
        }
        this.zone.run(() => {
            this.value.set(nextValue);
            this.touch.emit();
        });
    }
}
