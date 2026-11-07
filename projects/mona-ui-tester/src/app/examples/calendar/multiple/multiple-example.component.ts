import { DatePipe } from "@angular/common";
import { Component, computed, signal } from "@angular/core";
import { CalendarComponent } from "@nanahoshi/mona-ui/calendar";

@Component({
    selector: "app-calendar-multiple-example",
    imports: [CalendarComponent, DatePipe],
    templateUrl: "./multiple-example.component.html"
})
export class CalendarMultipleExampleComponent {
    protected readonly dates = computed(() => {
        const value = this.value();
        return Array.isArray(value) ? value : [];
    });
    protected readonly value = signal<Date | Date[] | null>([]);
}
