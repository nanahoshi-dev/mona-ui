import { DatePipe } from "@angular/common";
import { Component, computed, signal } from "@angular/core";
import { CalendarComponent } from "@nanahoshi/mona-ui/calendar";

@Component({
    selector: "app-calendar-range-example",
    imports: [CalendarComponent, DatePipe],
    templateUrl: "./range-example.component.html"
})
export class CalendarRangeExampleComponent {
    protected readonly ends = computed(() => {
        const range = this.range();
        return Array.isArray(range) && range.length === 2 ? range : null;
    });
    protected readonly range = signal<Date | Date[] | null>(null);
}
