import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, ElementRef, input, model, Signal, signal, viewChild } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { FormValueControl } from "@angular/forms/signals";
import { filter, fromEvent, switchMap, takeUntil, tap } from "rxjs";
import { SliderTickDirective } from "../../directives/slider-tick.directive";
import { LabelStylePipe } from "../../pipes/label-style.pipe";
import { TickStylePipe } from "../../pipes/tick-style.pipe";
import { SliderBaseComponent } from "../slider-base/slider-base.component";

@Component({
    selector: "mona-range-slider",
    templateUrl: "./range-slider.component.html",
    imports: [NgTemplateOutlet, SliderTickDirective, LabelStylePipe, TickStylePipe],
    host: {
        "[class]": "baseClasses()",
        "[class.mona-slider]": "true",
        "[attr.data-disabled]": "effectiveDisabled()",
        "[attr.data-orientation]": "orientation()",
        "(focus)": "focus()"
    }
})
export class RangeSliderComponent extends SliderBaseComponent implements FormValueControl<[number, number]> {
    protected readonly handlePositions = computed<[number, number]>(() => [
        this.positionFromValue(this.normalizedValue()[0]),
        this.positionFromValue(this.normalizedValue()[1])
    ]);
    protected readonly handlesOverlap = computed(() => {
        const values = this.normalizedValue();
        return values[0] === values[1];
    });
    protected readonly normalizedValue = computed<[number, number]>(() => {
        const value = this.value();
        const minValue = this.snapValue(value[0]);
        const maxValue = this.snapValue(value[1]);
        return [Math.min(minValue, maxValue), Math.max(minValue, maxValue)];
    });
    protected readonly primaryHandleFocused = signal(false);
    protected readonly primaryHandlePosition = computed(() => this.handlePositions()[0]);
    protected readonly primaryHandleStyle = computed<Partial<CSSStyleDeclaration>>(() => {
        const style = { ...this.handleTemplateStyles(), ...this.handleStyles() };
        if (this.handlesOverlap()) {
            return { ...style, zIndex: this.secondaryHandleOnTop() ? "1" : "2" };
        }
        return style;
    });
    protected readonly secondaryHandleFocused = signal(false);
    protected readonly secondaryHandleOnTop = signal(true);
    protected readonly secondaryHandlePosition = computed(() => this.handlePositions()[1]);
    protected readonly secondaryHandleStyle = computed<Partial<CSSStyleDeclaration>>(() => {
        const style = { ...this.handleTemplateStyles(), ...this.handleStyles() };
        if (this.handlesOverlap()) {
            return { ...style, zIndex: this.secondaryHandleOnTop() ? "2" : "1" };
        }
        return style;
    });
    protected readonly secondarySliderHandle: Signal<ElementRef<HTMLDivElement>> =
        viewChild.required("secondarySliderHandle");
    protected readonly selectionLeft = computed(() => this.handlePositions()[0]);
    protected readonly selectionRight = computed(() => this.handlePositions()[1]);
    protected readonly sliderHandle: Signal<ElementRef<HTMLDivElement>> = viewChild.required("sliderHandle");

    /**
     * @description Accessible name for the upper-value (secondary) handle.
     * @default "Maximum value"
     */
    public readonly ariaLabelEnd = input<string | null>("Maximum value", { alias: "aria-label-end" });

    /**
     * @description Accessible name for the lower-value (primary) handle.
     * @default "Minimum value"
     */
    public readonly ariaLabelStart = input<string | null>("Minimum value", { alias: "aria-label-start" });

    /**
     * @description Selected range as `[minimum, maximum]`.
     * Values outside `[minValue, maxValue]` are clamped; the tuple is always sorted, so index 0 ≤ index 1.
     * @default [0, 10]
     */
    public readonly value = model<[number, number]>([0, 10]);

    public focus(options?: FocusOptions): void {
        if (!this.effectiveDisabled()) {
            this.sliderHandle().nativeElement.focus(options);
        }
    }

    protected handleHandleMove(event: PointerEvent, isSecondary = false): void {
        this.updateRangedValue(this.getValueFromPointerEvent(event), isSecondary, true);
    }

    protected override setSubscriptions(): void {
        this.setClickSubscription();
        this.setKeydownSubscription();
        this.setPointerMoveSubscription();
        this.setFocusSubscription();
    }

    private getClosestHandle(event: PointerEvent): boolean {
        const currentValues = this.normalizedValue();
        if (currentValues[0] === currentValues[1]) {
            const containerRect = this.hostElementRef.nativeElement.getBoundingClientRect();
            let normalizedClickPos: number;

            if (this.orientation() === "horizontal") {
                const clickPos = event.clientX - containerRect.left;
                normalizedClickPos = (clickPos / containerRect.width) * 100;
            } else {
                const clickPos = event.clientY - containerRect.top;
                normalizedClickPos = 100 - (clickPos / containerRect.height) * 100;
            }

            const clickValue = this.getValueFromPosition(normalizedClickPos);
            return clickValue > currentValues[0];
        }

        const primaryRect = this.sliderHandle().nativeElement.getBoundingClientRect();
        const secondaryRect = this.secondarySliderHandle().nativeElement.getBoundingClientRect();
        const primaryDistance = Math.sqrt(
            Math.pow(primaryRect.left + primaryRect.width / 2 - event.clientX, 2) +
                Math.pow(primaryRect.top + primaryRect.height / 2 - event.clientY, 2)
        );
        const secondaryDistance = Math.sqrt(
            Math.pow(secondaryRect.left + secondaryRect.width / 2 - event.clientX, 2) +
                Math.pow(secondaryRect.top + secondaryRect.height / 2 - event.clientY, 2)
        );

        return secondaryDistance < primaryDistance;
    }

    private setClickSubscription(): void {
        fromEvent<PointerEvent>(this.hostElementRef.nativeElement, "click")
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                tap(() => this.dragging.set(false)),
                filter(() => !this.effectiveDisabled())
            )
            .subscribe((event: PointerEvent) => {
                const isSecondary = this.getClosestHandle(event);
                this.handleHandleMove(event, isSecondary);
            });
    }

    private setFocusSubscription(): void {
        fromEvent(this.sliderHandle().nativeElement, "focus")
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.zone.run(() => {
                    this.primaryHandleFocused.set(true);
                    this.secondaryHandleFocused.set(false);
                });
            });

        fromEvent(this.sliderHandle().nativeElement, "blur")
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.zone.run(() => {
                    this.primaryHandleFocused.set(false);
                    this.touch.emit();
                });
            });

        fromEvent(this.secondarySliderHandle().nativeElement, "focus")
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.zone.run(() => {
                    this.secondaryHandleFocused.set(true);
                    this.primaryHandleFocused.set(false);
                });
            });

        fromEvent(this.secondarySliderHandle().nativeElement, "blur")
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.zone.run(() => {
                    this.secondaryHandleFocused.set(false);
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
            .subscribe(event => {
                const newValue = this.calculateNewValue(this.normalizedValue()[0], event);
                this.updateRangedValue(newValue, false, false);
            });

        fromEvent<KeyboardEvent>(this.secondarySliderHandle().nativeElement, "keydown")
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                filter(() => !this.effectiveDisabled()),
                filter(event => this.isNavigationKey(event)),
                tap(event => {
                    event.preventDefault();
                    event.stopPropagation();
                })
            )
            .subscribe(event => {
                const newValue = this.calculateNewValue(this.normalizedValue()[1], event);
                this.updateRangedValue(newValue, true, false);
            });
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
                        tap((event: PointerEvent) => this.handleHandleMove(event, false)),
                        takeUntil(pointerUp$.pipe(tap(() => this.zone.run(() => this.dragging.set(false)))))
                    )
                )
            )
            .subscribe();

        fromEvent<PointerEvent>(this.secondarySliderHandle().nativeElement, "pointerdown")
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                filter(() => !this.effectiveDisabled()),
                tap(() => this.dragging.set(true)),
                switchMap(() =>
                    pointerMove$.pipe(
                        tap((event: PointerEvent) => this.handleHandleMove(event, true)),
                        takeUntil(pointerUp$.pipe(tap(() => this.zone.run(() => this.dragging.set(false)))))
                    )
                )
            )
            .subscribe();
    }

    private updateRangedValue(value: number, isSecondary: boolean, isDragging = false): void {
        const currentValues = this.normalizedValue();
        const currentMinValue = currentValues[0];
        const currentMaxValue = currentValues[1];

        let newMinValue = currentMinValue;
        let newMaxValue = currentMaxValue;

        if (isSecondary) {
            if (isDragging && value < currentMinValue) {
                newMinValue = value;
                newMaxValue = value;
                this.secondaryHandleOnTop.set(true);
            } else {
                newMaxValue = Math.max(value, currentMinValue);
                if (newMaxValue === currentMinValue) {
                    this.secondaryHandleOnTop.set(true);
                }
            }
        } else {
            if (isDragging && value > currentMaxValue) {
                newMinValue = value;
                newMaxValue = value;
                this.secondaryHandleOnTop.set(false);
            } else {
                newMinValue = Math.min(value, currentMaxValue);
                if (newMinValue === currentMaxValue) {
                    this.secondaryHandleOnTop.set(false);
                }
            }
        }

        newMinValue = this.snapValue(newMinValue);
        newMaxValue = this.snapValue(newMaxValue);

        if (newMinValue === currentMinValue && newMaxValue === currentMaxValue) {
            return;
        }

        this.zone.run(() => {
            this.value.set([newMinValue, newMaxValue]);
            this.touch.emit();
        });
    }
}
