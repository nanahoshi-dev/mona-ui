import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, effect, input, output, signal, untracked } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LucideCode } from "@lucide/angular";
import { where } from "@mirei/ts-collections";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { DropdownListComponent, DropdownListValueTemplateDirective } from "@nanahoshi/mona-ui/dropdown-list";
import { DropdownItemTemplateDirective } from "@nanahoshi/mona-ui/dropdowns";
import { NumericTextBoxComponent } from "@nanahoshi/mona-ui/numeric-text-box";
import { SwitchComponent } from "@nanahoshi/mona-ui/switch";
import { TabComponent, TabContentTemplateDirective, TabsComponent } from "@nanahoshi/mona-ui/tabs";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";
import { ComponentMetadata } from "../../models/ComponentMetadata";
import { ComponentConfig, ComponentInputs, createComponentPropertyConfig } from "../../utils/componentConfig";
import { ApiInputListItemComponent } from "../api-input-list-item/api-input-list-item.component";
import { CodeViewerComponent } from "../code-viewer/code-viewer.component";

@Component({
    selector: "app-config",
    imports: [
        FormsModule,
        SwitchComponent,
        DropdownListComponent,
        NumericTextBoxComponent,
        ApiInputListItemComponent,
        CodeViewerComponent,
        ButtonDirective,
        NgTemplateOutlet,
        DropdownListValueTemplateDirective,
        DropdownItemTemplateDirective,
        TabsComponent,
        TabComponent,
        TabContentTemplateDirective,
        TextBoxComponent,
        LucideCode
    ],
    templateUrl: "./config.component.html"
})
export class ConfigComponent<C> {
    readonly #componentPropertyConfig = computed(() => {
        const config = this.config();
        const metadata = this.metadata();
        let updatedConfig = config;
        let updatedOutputs = config.outputs;
        if (
            metadata &&
            Object.keys(metadata).length > 0 &&
            (!config.outputs || Object.keys(config.outputs).length === 0)
        ) {
            updatedOutputs = where(metadata.inputs, i => i.kind === "output")
                .select(i => [i.name, { type: "event" }] as const)
                .toObject(
                    e => e[0],
                    e => e[1]
                );
            updatedConfig = { ...config, outputs: updatedOutputs };
        }
        return createComponentPropertyConfig(updatedConfig);
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
                untracked(() => this.valueChange.emit(oo));
            }
        });
    }

    public onValueChange(key: string, value: unknown): void {
        this.outputObject.update(o => ({ ...o, [key]: value }));
    }

    protected readonly Object = Object;
}
