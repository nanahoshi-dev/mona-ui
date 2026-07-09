import { DatePipe, JsonPipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DropdownItemTemplateDirective } from "@nanahoshi/mona-ui/dropdowns";
import { ColorPickerComponent } from "@nanahoshi/mona-ui/color-picker";
import { DropdownListComponent, DropdownListValueTemplateDirective } from "@nanahoshi/mona-ui/dropdown-list";
import { NumericTextBoxComponent } from "@nanahoshi/mona-ui/numeric-text-box";
import { SwitchComponent } from "@nanahoshi/mona-ui/switch";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";
import { ComponentMetadata } from "../../models/ComponentMetadata";
import { InputPropertyPipe } from "../../pipes/input-type.pipe";
import { ProcessedConfigItem } from "../../utils/componentConfig";

@Component({
    selector: "app-api-input-list-item",
    imports: [
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
    templateUrl: "./api-input-list-item.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApiInputListItemComponent {
    public readonly entry = input.required<ProcessedConfigItem>();
    public readonly metadata = input.required<ComponentMetadata>();
    public readonly valueChange = output<{ property: string; value: unknown }>();

    protected onValueChange(property: string, value: unknown): void {
        this.valueChange.emit({ property, value });
    }
}
