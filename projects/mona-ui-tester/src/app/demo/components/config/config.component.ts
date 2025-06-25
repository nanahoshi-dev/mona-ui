import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
    ColorPickerComponent,
    DropDownListComponent,
    NumericTextBoxComponent,
    SwitchComponent,
    TextBoxComponent
} from "mona-ui";
import { ComponentMetadata } from "../../models/ComponentMetadata";
import { InputPropertyPipe } from "../../pipes/input-type.pipe";
import { ComponentConfig, ComponentInputs, createComponentPropertyConfigArray } from "../../utils/componentConfig";

@Component({
    selector: "app-config",
    imports: [
        FormsModule,
        TextBoxComponent,
        NumericTextBoxComponent,
        DropDownListComponent,
        SwitchComponent,
        ColorPickerComponent,
        InputPropertyPipe
    ],
    templateUrl: "./config.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigComponent<C> {
    public readonly config = input.required<ComponentConfig<C>>();
    public readonly configObjList = computed(() => {
        const config = this.config();
        return createComponentPropertyConfigArray(config);
    });
    public readonly metadata = input.required<ComponentMetadata>();
    public readonly outputObject = signal<ComponentInputs<C>>({});
    public readonly valueChange = output<ComponentInputs<C>>();

    public constructor() {
        effect(() => {
            const oo = this.outputObject();
            if (Object.keys(oo).length > 0) {
                this.valueChange.emit(oo);
            }
        });
    }

    public onValueChange(key: string, value: unknown): void {
        this.outputObject.update(o => ({ ...o, [key]: value }));
    }
}
