import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, ElementRef, input, model, Signal, signal, viewChild } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { FormValueControl } from "@angular/forms/signals";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import { filter, fromEvent, tap } from "rxjs";
import { LabelStylePipe } from "../../pipes/label-style.pipe";
import { TickStylePipe } from "../../pipes/tick-style.pipe";
import { SLIDER_DEFAULT_MESSAGES } from "../../i18n/slider.default-messages";
import { SliderBaseComponent } from "../slider-base/slider-base.component";

@Component({
    selector: "mona-range-slider",
    templateUrl: "./range-slider.component.html",
    imports: [NgTemplateOutlet, LabelStylePipe, TickStylePipe],
    host: {
        // The description and the handles' names are applied to the handles, so the host must not keep the static
        // attributes. aria-label-start and aria-label-end aren't ARIA attributes at all.
        "[attr.aria-describedby]": "null",
        "[attr.aria-label-end]": "null",
        "[attr.aria-label-start]": "null",
        "[class]": "baseClasses()",
        "[class.mona-slider]": "true",
        "[attr.data-disabled]": "effectiveDisabled() || null",
        "[attr.data-orientation]": "orientation()",
        "[attr.data-readonly]": "readonly() || null",
        "[attr.aria-label]": "ariaLabel()",
        "[attr.aria-labelledby]": "labelledBy()",
        "[attr.role]": "'group'"
    }
})
export class RangeSliderComponent extends SliderBaseComponent implements FormValueControl<[number, number]> {
    protected readonly computedAriaLabelEnd = computed(() => this.ariaLabelEnd() ?? this.messages().maximumValue);
    protected readonly computedAriaLabelStart = computed(() => this.ariaLabelStart() ?? this.messages().minimumValue);
    protected readonly endHandleId = createElementControlId();
    // Each handle reads the group's label and then its own, so two range sliders on a page sound different.
    protected readonly endLabelledBy = computed(() => {
        const labelledBy = this.labelledBy();
        return labelledBy ? `${labelledBy} ${this.endHandleId}` : null;
    });
    protected readonly handlePositions = computed<[number, number]>(() => [
        this.positionFromValue(this.normalizedValue()[0]),
        this.positionFromValue(this.normalizedValue()[1])
    ]);
    protected readonly handlesOverlap = computed(() => {
        const values = this.normalizedValue();
        return values[0] === values[1];
    });
    protected readonly messages = this.i18n.componentMessages("slider", SLIDER_DEFAULT_MESSAGES);
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
    protected readonly startHandleId = createElementControlId();
    protected readonly startLabelledBy = computed(() => {
        const labelledBy = this.labelledBy();
        return labelledBy ? `${labelledBy} ${this.startHandleId}` : null;
    });
    protected readonly valueIsShown = computed(() => {
        const [lower, upper] = this.normalizedValue();
        const [first, second] = this.value();
        return lower === first && upper === second;
    });

    /**
     * @description Accessible name for the upper-value (secondary) handle.
     * @default null
     */
    public readonly ariaLabelEnd = input<string | null>(null, { alias: "aria-label-end" });

    /**
     * @description Accessible name for the lower-value (primary) handle.
     * @default null
     */
    public readonly ariaLabelStart = input<string | null>(null, { alias: "aria-label-start" });

    /**
     * @description Selected range as `[minimum, maximum]`.
     * A value out of range, off the step grid or unsorted is shown at the nearest valid values, and the model keeps its
     * own until the user changes it. A development warning reports it.
     * @default [0, 10]
     */
    public readonly value = model<[number, number]>([0, 10]);

    /** Moves focus to the lower handle. Does nothing while disabled. */
    public focus(options?: FocusOptions): void {
        if (!this.effectiveDisabled()) {
            this.sliderHandle().nativeElement.focus(options);
        }
    }

    protected handleHandleMove(event: PointerEvent, isSecondary = false): void {
        this.updateRangedValue(this.getValueFromPointerEvent(event), isSecondary);
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
                const clickPos = this.isRtl()
                    ? containerRect.right - event.clientX
                    : event.clientX - containerRect.left;
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
                filter(() => !this.interactionDisabled())
            )
            .subscribe((event: PointerEvent) => {
                const target = event.target as Node;
                // A drag ends with a click on the handle, and moving the closest handle would move the other one.
                if (
                    this.sliderHandle().nativeElement.contains(target) ||
                    this.secondarySliderHandle().nativeElement.contains(target)
                ) {
                    return;
                }
                const isSecondary = this.getClosestHandle(event);
                this.handleHandleMove(event, isSecondary);
                const handle = isSecondary ? this.secondarySliderHandle() : this.sliderHandle();
                handle.nativeElement.focus({ preventScroll: true });
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
                filter(() => !this.interactionDisabled()),
                filter(event => this.isNavigationKey(event)),
                tap(event => {
                    event.preventDefault();
                    event.stopPropagation();
                })
            )
            .subscribe(event => {
                const newValue = this.calculateNewValue(this.normalizedValue()[0], event);
                this.updateRangedValue(newValue, false);
            });

        fromEvent<KeyboardEvent>(this.secondarySliderHandle().nativeElement, "keydown")
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                filter(() => !this.interactionDisabled()),
                filter(event => this.isNavigationKey(event)),
                tap(event => {
                    event.preventDefault();
                    event.stopPropagation();
                })
            )
            .subscribe(event => {
                const newValue = this.calculateNewValue(this.normalizedValue()[1], event);
                this.updateRangedValue(newValue, true);
            });
    }

    private setPointerMoveSubscription(): void {
        this.trackRangeHandle(this.sliderHandle().nativeElement, false);
        this.trackRangeHandle(this.secondarySliderHandle().nativeElement, true);
    }

    private trackRangeHandle(handle: HTMLElement, startsSecondary: boolean): void {
        this.trackHandleDrag(handle, () => {
            let isSecondary = startsSecondary;
            return event => {
                const value = this.getValueFromPointerEvent(event);
                const [lower, upper] = this.normalizedValue();
                // Handles stop at each other, so stacked ones are told apart by the way the pointer moves. Otherwise
                // the one on top could be stuck.
                if (lower === upper && value !== lower && isSecondary !== value > lower) {
                    isSecondary = value > lower;
                    const active = isSecondary ? this.secondarySliderHandle() : this.sliderHandle();
                    active.nativeElement.focus({ preventScroll: true });
                }
                this.updateRangedValue(value, isSecondary);
            };
        });
    }

    private updateRangedValue(value: number, isSecondary: boolean): void {
        const currentValues = this.normalizedValue();
        const currentMinValue = currentValues[0];
        const currentMaxValue = currentValues[1];

        let newMinValue = currentMinValue;
        let newMaxValue = currentMaxValue;

        if (isSecondary) {
            newMaxValue = Math.max(value, currentMinValue);
            if (newMaxValue === currentMinValue) {
                this.secondaryHandleOnTop.set(true);
            }
        } else {
            newMinValue = Math.min(value, currentMaxValue);
            if (newMinValue === currentMaxValue) {
                this.secondaryHandleOnTop.set(false);
            }
        }

        newMinValue = this.snapValue(newMinValue);
        newMaxValue = this.snapValue(newMaxValue);

        if (newMinValue === currentMinValue && newMaxValue === currentMaxValue) {
            return;
        }

        this.zone.run(() => this.value.set([newMinValue, newMaxValue]));
    }
}
