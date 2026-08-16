import { AfterViewInit, Directive, ElementRef, inject, input, OnDestroy } from "@angular/core";
import { CHART_CONTEXT } from "../context/chart-context.token";

@Directive({
    selector: "[monaChartLabelMeasure]"
})
export class ChartLabelMeasureDirective implements AfterViewInit, OnDestroy {
    readonly #chartContext = inject(CHART_CONTEXT, { optional: true });
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

    public readonly sliceId = input.required<string>({ alias: "monaChartLabelMeasure" });

    public ngAfterViewInit(): void {
        this.#chartContext?.observeLabelElement?.(this.#elementRef.nativeElement, this.sliceId());
    }

    public ngOnDestroy(): void {
        this.#chartContext?.unobserveLabelElement?.(this.#elementRef.nativeElement, this.sliceId());
    }
}
