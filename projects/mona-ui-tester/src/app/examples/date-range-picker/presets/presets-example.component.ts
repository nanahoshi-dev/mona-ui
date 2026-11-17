import { Component, signal } from "@angular/core";
import {
    type DateRange,
    DateRangePickerComponent,
    type DateRangePreset,
    type DateRangePresetKey
} from "@nanahoshi/mona-ui/date-range-picker";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";

const now = new Date();

/** From the first day of the quarter today is in, up to today. */
const quarterToDate: DateRangePreset = {
    label: "Quarter to date",
    range: today => ({
        end: today,
        start: new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)
    })
};

@Component({
    selector: "app-date-range-picker-presets-example",
    imports: [DateRangePickerComponent, FormFieldComponent],
    templateUrl: "./presets-example.component.html"
})
export class DateRangePickerPresetsExampleComponent {
    protected readonly period = signal<DateRange | null>(null);
    protected readonly presets: readonly (DateRangePreset | DateRangePresetKey)[] = [
        "today",
        "yesterday",
        "last7Days",
        "last30Days",
        "thisMonth",
        "lastMonth",
        quarterToDate,
        "thisYear"
    ];
    protected readonly today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
