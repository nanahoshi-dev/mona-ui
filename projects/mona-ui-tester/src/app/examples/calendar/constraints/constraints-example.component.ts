import { Component, signal } from "@angular/core";
import { CalendarComponent } from "@nanahoshi/mona-ui/calendar";

/** Midnight, a number of days from today. */
const daysFromToday = (days: number): Date => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return date;
};

@Component({
    selector: "app-calendar-constraints-example",
    imports: [CalendarComponent],
    templateUrl: "./constraints-example.component.html"
})
export class CalendarConstraintsExampleComponent {
    protected readonly date = signal<Date | Date[] | null>(null);
    protected readonly maxDate = daysFromToday(30);
    protected readonly minDate = daysFromToday(1);
    protected readonly isWeekend = (date: Date): boolean => date.getDay() === 0 || date.getDay() === 6;
}
