import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input, model, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AutoCompleteComponent } from "mona-ui";
import { dropdownFoodData } from "../../../../assets/dropdown.data";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-auto-complete-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./auto-complete-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AutoCompleteDemoComponent extends AbstractDemoComponent<AutoCompleteComponent<any>> {
    readonly #injector = createFeatureInjector({});
    protected readonly config = signal<ComponentConfig<AutoCompleteComponent<any>>>({
        code: ``,
        inputs: {
            data: {
                type: "iterable",
                value: []
            },
            disabled: {
                type: "boolean",
                value: false
            },
            itemDisabled: {
                type: "function",
                value: (item: any) => false
            },
            placeholder: {
                type: "string",
                value: ""
            },
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"],
                defaultValue: "medium"
            },
            showClearButton: {
                type: "boolean",
                value: false
            },
            size: {
                type: "dropdown",
                value: ["small", "medium", "large"],
                defaultValue: "medium"
            },
            textField: {
                type: "string",
                value: "text"
            },
            valueField: {
                type: "string",
                value: "value"
            }
        },
        outputs: {},
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("AutoCompleteComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly AutoCompleteWrapperComponent = AutoCompleteWrapperComponent;
}

@Component({
    imports: [AutoCompleteComponent, FormsModule],
    template: `
        <mona-auto-complete
            [data]="autoCompleteData()"
            [disabled]="disabled()"
            [itemDisabled]="itemDisabled()"
            [placeholder]="placeholder()"
            [rounded]="rounded()"
            [showClearButton]="showClearButton()"
            [size]="size()"
            [textField]="textField()"
            [valueField]="valueField()"
            [ngModel]="selectedItem()"
            (ngModelChange)="onItemSelect($event)"
            class="w-50"></mona-auto-complete>
    `,
    host: {
        class: "h-full"
    }
})
class AutoCompleteWrapperComponent implements ComponentInputsAsSignal<AutoCompleteComponent> {
    protected readonly autoCompleteData = computed(() => {
        return dropdownFoodData;
    });
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly selectedItem = signal<unknown | null>(null);
    public readonly data = input<ReturnType<AutoCompleteComponent["data"]>>([]);
    public readonly disabled = model<ReturnType<AutoCompleteComponent["disabled"]>>(false);
    public readonly itemDisabled = input<ReturnType<AutoCompleteComponent["itemDisabled"]>>((item: any) => false);
    public readonly placeholder = input<ReturnType<AutoCompleteComponent["placeholder"]>>("");
    public readonly rounded = input<ReturnType<AutoCompleteComponent["rounded"]>>("medium");
    public readonly showClearButton = input<ReturnType<AutoCompleteComponent["showClearButton"]>>(false);
    public readonly size = input<ReturnType<AutoCompleteComponent["size"]>>("small");
    public readonly textField = input<ReturnType<AutoCompleteComponent["textField"]>>("text");
    public readonly valueField = input<ReturnType<AutoCompleteComponent["valueField"]>>("value");

    public onItemSelect(item: any) {
        this.selectedItem.set(item);
        console.log(item);
    }
}
