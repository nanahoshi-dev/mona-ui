import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
    CheckBoxComponent,
    DropDownListComponent,
    NumericTextBoxComponent,
    SwitchComponent,
    TextBoxComponent
} from "mona-ui";
import { ComponentConfig, ComponentInputs, createComponentInputConfigArray } from "../../utils/componentConfig";

@Component({
    selector: "app-config",
    imports: [
        FormsModule,
        TextBoxComponent,
        NumericTextBoxComponent,
        CheckBoxComponent,
        DropDownListComponent,
        SwitchComponent
    ],
    templateUrl: "./config.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigComponent<C> {
    public readonly config = input.required<ComponentConfig<C>>();
    public readonly configObjList = computed(() => {
        const config = this.config();
        return createComponentInputConfigArray(config);
    });
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
