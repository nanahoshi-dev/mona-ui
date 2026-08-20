import { AfterViewInit, Directive, ElementRef, inject, input, OnDestroy } from "@angular/core";
import { CHART_CONTEXT } from "../context/chart-context.token";

@Directive({
    selector: "[monaChartDataLabelMeasure]"
})
export class ChartDataLabelMeasureDirective implements AfterViewInit, OnDestroy {
    readonly #chartContext = inject(CHART_CONTEXT, { optional: true });
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

    public readonly labelId = input.required<string>({ alias: "monaChartDataLabelMeasure" });

    public ngAfterViewInit(): void {
        const id = this.labelId();
        if (id) {
            this.#chartContext?.observeDataLabelElement?.(this.#elementRef.nativeElement, id);
        }
    }

    public ngOnDestroy(): void {
        const id = this.labelId();
        if (id) {
            this.#chartContext?.unobserveDataLabelElement?.(this.#elementRef.nativeElement, id);
        }
    }
}
