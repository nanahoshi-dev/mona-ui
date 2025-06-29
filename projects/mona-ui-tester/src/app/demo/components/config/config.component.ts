import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal, untracked } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ChevronsUpDown, Code, LucideAngularModule } from "lucide-angular";
import { ButtonDirective, SwitchComponent } from "mona-ui";
import { ComponentMetadata } from "../../models/ComponentMetadata";
import { InputPropertyPipe } from "../../pipes/input-type.pipe";
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
        LucideAngularModule,
        InputPropertyPipe
    ],
    templateUrl: "./config.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigComponent<C> {
    readonly #componentPropertyConfig = computed(() => {
        const config = this.config();
        return createComponentPropertyConfig(config);
    });
    protected readonly codeIcon = Code;
    protected readonly expandIcon = ChevronsUpDown;
    public readonly config = input.required<ComponentConfig<C>>();
    public readonly inputProperties = computed(() => {
        return this.#componentPropertyConfig().inputs;
    });
    public readonly metadata = input.required<ComponentMetadata>();
    public readonly outputObject = signal<ComponentInputs<C>>({});
    public readonly outputProperties = computed(() => {
        return this.#componentPropertyConfig().outputs;
    });
    public readonly subComponentMetadata = input<Record<string, ComponentMetadata>>();
    public readonly subComponentPropertyConfig = computed(() => {
        const subComponents = this.subComponentMetadata();
        return Object.entries(
            Object.entries(subComponents || {}).reduce(
                (acc, [key, metadata]) => {
                    acc[key] = { ...metadata, expanded: false };
                    return acc;
                },
                {} as Record<string, ComponentMetadata & { expanded: boolean }>
            )
        );
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
                untracked(() => this.valueChange.emit(oo));
            }
        });
    }

    public onValueChange(key: string, value: unknown): void {
        this.outputObject.update(o => ({ ...o, [key]: value }));
    }
}
