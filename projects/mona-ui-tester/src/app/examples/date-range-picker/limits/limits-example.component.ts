import { Component, signal } from "@angular/core";
import { type DateRange, DateRangePickerComponent } from "@nanahoshi/mona-ui/date-range-picker";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";

const now = new Date();

@Component({
    selector: "app-date-range-picker-limits-example",
    imports: [DateRangePickerComponent, FormFieldComponent],
    templateUrl: "./limits-example.component.html"
})
export class DateRangePickerLimitsExampleComponent {
    protected readonly booking = signal<DateRange | null>(null);
    protected readonly lastDay = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    protected readonly today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    protected readonly isMonday = (date: Date): boolean => date.getDay() === 1;
}
