import { DatePipe, JsonPipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DropDownItemTemplateDirective } from "@mirei/mona-ui/dropdowns";
import { ColorPickerComponent } from "@mirei/mona-ui/color-picker";
import { DropdownListComponent, DropDownListValueTemplateDirective } from "@mirei/mona-ui/dropdown-list";
import { NumericTextBoxComponent } from "@mirei/mona-ui/numeric-text-box";
import { SwitchComponent } from "@mirei/mona-ui/switch";
import { TextBoxComponent } from "@mirei/mona-ui/text-box";
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
        DropDownItemTemplateDirective,
        JsonPipe,
        DropDownListValueTemplateDirective,
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
