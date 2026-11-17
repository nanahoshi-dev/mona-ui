import { DatePipe } from "@angular/common";
import { Component, computed, signal } from "@angular/core";
import { CalendarComponent } from "@nanahoshi/mona-ui/calendar";

@Component({
    selector: "app-calendar-months-example",
    imports: [CalendarComponent, DatePipe],
    templateUrl: "./months-example.component.html"
})
export class CalendarMonthsExampleComponent {
    protected readonly ends = computed(() => {
        const range = this.quarter();
        return Array.isArray(range) && range.length === 2 ? range : null;
    });
    protected readonly quarter = signal<Date | Date[] | null>(null);
}
