import { DatePipe, JsonPipe } from "@angular/common";
import { Component, computed, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ColorPickerComponent } from "@nanahoshi/mona-ui/color-picker";
import { DropdownListComponent, DropdownListValueTemplateDirective } from "@nanahoshi/mona-ui/dropdown-list";
import { DropdownItemTemplateDirective } from "@nanahoshi/mona-ui/dropdowns";
import { NumericTextBoxComponent } from "@nanahoshi/mona-ui/numeric-text-box";
import { SwitchComponent } from "@nanahoshi/mona-ui/switch";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";
import { ApiProseComponent } from "../../../api/components/api-prose/api-prose.component";
import { ComponentMetadata } from "../../models/ComponentMetadata";
import { InputPropertyPipe } from "../../pipes/input-type.pipe";
import { ProcessedConfigItem } from "../../utils/componentConfig";

@Component({
    selector: "app-api-input-list-item",
    imports: [
        ApiProseComponent,
        InputPropertyPipe,
        ColorPickerComponent,
        DropdownListComponent,
        NumericTextBoxComponent,
        FormsModule,
        TextBoxComponent,
        SwitchComponent,
        DropdownItemTemplateDirective,
        JsonPipe,
        DropdownListValueTemplateDirective,
        DatePipe
    ],
    templateUrl: "./api-input-list-item.component.html"
})
export class ApiInputListItemComponent {
    /** What the row shows as the input's name, and what its control is named after. */
    protected readonly label = computed(() => this.entry().alias ?? this.entry().name);
    public readonly entry = input.required<ProcessedConfigItem>();
    public readonly metadata = input.required<ComponentMetadata>();
    public readonly valueChange = output<{ property: string; value: unknown }>();

    protected onValueChange(property: string, value: unknown): void {
        this.valueChange.emit({ property, value });
    }
}
