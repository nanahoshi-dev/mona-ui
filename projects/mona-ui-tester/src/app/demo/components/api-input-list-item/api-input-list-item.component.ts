import { DatePipe, JsonPipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
    ColorPickerComponent,
    DropDownItemTemplateDirective,
    DropdownListComponent,
    DropDownListValueTemplateDirective,
    NumericTextBoxComponent,
    SwitchComponent,
    TextBoxComponent
} from "mona-ui";
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
