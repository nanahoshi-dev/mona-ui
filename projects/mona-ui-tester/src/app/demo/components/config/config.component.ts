import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Code, LucideAngularModule } from "lucide-angular";
import { ButtonDirective, SwitchComponent } from "mona-ui";
import { ComponentMetadata } from "../../models/ComponentMetadata";
import { ComponentConfig, ComponentInputs, createComponentPropertyConfig } from "../../utils/componentConfig";
import { ApiInputListItemComponent } from "../api-input-list-item/api-input-list-item.component";
import { CodeViewerComponent } from "../code-viewer/code-viewer.component";

@Component({
    selector: "app-config",
    imports: [
        FormsModule,
        SwitchComponent,
        ApiInputListItemComponent,
        CodeViewerComponent,
        ButtonDirective,
        LucideAngularModule
    ],
    templateUrl: "./config.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigComponent<C> {
    readonly #componentPropertyConfig = computed(() => {
        const config = this.config();
        return createComponentPropertyConfig(config);
    });
    public readonly config = input.required<ComponentConfig<C>>();
    public readonly inputProperties = computed(() => {
        return this.#componentPropertyConfig().inputs;
    });
    public readonly metadata = input.required<ComponentMetadata>();
    public readonly outputObject = signal<ComponentInputs<C>>({});
    public readonly outputProperties = computed(() => {
        return this.#componentPropertyConfig().outputs;
    });
    public readonly templateHandler = computed(() => {
        return this.#componentPropertyConfig().templates;
    });
    public readonly templateProperties = computed(() => {
        const templateHandler = this.templateHandler();
        return Object.entries(templateHandler?.data() || {});
    });
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

    protected readonly Object = Object;
    protected readonly Code = Code;
}
