import { Component, signal } from "@angular/core";
import { form, FormField, required, submit, validate } from "@angular/forms/signals";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { type DateRange, DateRangePickerComponent } from "@nanahoshi/mona-ui/date-range-picker";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";

interface LeaveRequest {
    leave: DateRange | null;
}

/** Whole days from one date to another, counted on the calendar so a change of clocks doesn't shift it. */
function daysBetween(start: Date, end: Date): number {
    const day = (date: Date): number => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.round((day(end) - day(start)) / 86_400_000);
}

@Component({
    selector: "app-date-range-picker-signal-forms-example",
    imports: [ButtonDirective, DateRangePickerComponent, FormField, FormFieldComponent],
    templateUrl: "./signal-forms-example.component.html"
})
export class DateRangePickerSignalFormsExampleComponent {
    readonly #model = signal<LeaveRequest>({ leave: null });
    protected readonly request = form(this.#model, path => {
        required(path.leave);
        // The required rule only checks for an empty range; this checks that both ends are there.
        validate(path.leave, ({ value }) => {
            const leave = value();
            if (!leave) {
                return null;
            }
            if (!leave.start || !leave.end) {
                return { kind: "incomplete", message: "Enter the first and the last day." };
            }
            return daysBetween(leave.start, leave.end) + 1 > 14
                ? { kind: "tooLong", message: "Leave can be up to two weeks." }
                : null;
        });
    });
    protected readonly sent = signal(false);

    protected onSubmit(event: Event): void {
        event.preventDefault();
        void submit(this.request, async () => {
            this.sent.set(true);
        });
    }
}
