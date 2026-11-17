import { Component, computed, signal } from "@angular/core";
import { type DateRange, DateRangePickerComponent } from "@nanahoshi/mona-ui/date-range-picker";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";

/** Whole days from one date to another, counted on the calendar so a change of clocks doesn't shift it. */
function daysBetween(start: Date, end: Date): number {
    const day = (date: Date): number => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.round((day(end) - day(start)) / 86_400_000);
}

@Component({
    selector: "app-date-range-picker-basic-example",
    imports: [DateRangePickerComponent, FormFieldComponent],
    templateUrl: "./basic-example.component.html"
})
export class DateRangePickerBasicExampleComponent {
    protected readonly nights = computed(() => {
        const stay = this.stay();
        return stay?.start && stay.end ? daysBetween(stay.start, stay.end) : 0;
    });
    protected readonly stay = signal<DateRange | null>(null);
}
