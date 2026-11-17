import { Component, signal } from "@angular/core";
import { form, FormField, required } from "@angular/forms/signals";
import { DatePickerComponent } from "@nanahoshi/mona-ui/date-picker";
import { DropdownListComponent } from "@nanahoshi/mona-ui/dropdown-list";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";
import { RadioButtonComponent, RadioGroupComponent } from "@nanahoshi/mona-ui/radio-button";
import { SwitchComponent } from "@nanahoshi/mona-ui/switch";
import { TextAreaDirective } from "@nanahoshi/mona-ui/text-area";

interface BookingModel {
    date: Date | null;
    newsletter: boolean;
    notes: string;
    room: string | null;
    seating: string;
}

@Component({
    selector: "app-form-field-other-controls-example",
    imports: [
        DatePickerComponent,
        DropdownListComponent,
        FormField,
        FormFieldComponent,
        RadioButtonComponent,
        RadioGroupComponent,
        SwitchComponent,
        TextAreaDirective
    ],
    templateUrl: "./other-controls-example.component.html"
})
export class FormFieldOtherControlsExampleComponent {
    readonly #model = signal<BookingModel>({ date: null, newsletter: false, notes: "", room: null, seating: "table" });
    protected readonly booking = form(this.#model, path => {
        required(path.date);
        required(path.room);
    });
    protected readonly rooms = ["Garden", "Library", "Terrace"];
}
