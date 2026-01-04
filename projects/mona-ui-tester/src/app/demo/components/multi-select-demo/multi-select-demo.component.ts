import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input, model, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { aggregate, range } from "@mirei/ts-collections";
import { DropDownVirtualScrollDirective, MultiSelectComponent, VirtualScrollOptions } from "mona-ui";
import { dropdownFoodData } from "../../../../assets/dropdown.data";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import {
    dropdownDataSetFeatureConfig,
    dropdownVirtualizationFeatureConfig,
    getFormValueText
} from "../../utils/dropdownFeatureConfigs";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-multi-select-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./multi-select-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MultiSelectDemoComponent extends AbstractDemoComponent<MultiSelectComponent> {
    readonly #injector = createFeatureInjector({
        dataSet: dropdownDataSetFeatureConfig("multi select"),
        virtualization: dropdownVirtualizationFeatureConfig("multi select")
    });
    protected readonly config = signal<ComponentConfig<MultiSelectComponent>>({
        code: ``,
        inputs: {
            data: {
                type: "object"
            },
            disabled: {
                type: "boolean",
                value: false
            },
            itemDisabled: {
                type: "dropdown",
                value: ["active", (item: any) => item.price > 5, (item: any) => item.price < 5],
                defaultValue: null,
                clearable: true,
                placeholder: "Select a condition..."
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
                value: ["medium", "small", "large"],
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
    protected readonly metadata = this.getMetadata("MultiSelectComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly MultiSelectWrapperComponent = MultiSelectWrapperComponent;
}

@Component({
    imports: [ReactiveFormsModule, MultiSelectComponent, DropDownVirtualScrollDirective],
    template: `
        <!--        @let featureData = features();-->
        <span>Selected Values: {{ formValueText() }}</span>
        <form [formGroup]="formGroup">
            <mona-multi-select
                [data]="multiSelectData()"
                [disabled]="disabled()"
                [itemDisabled]="itemDisabled()"
                [rounded]="rounded()"
                [showClearButton]="showClearButton()"
                [size]="size()"
                [textField]="textField()"
                [valueField]="valueField()"
                [monaDropDownVirtualScroll]="virtualization()"
                class="w-80"></mona-multi-select>
        </form>
    `
})
class MultiSelectWrapperComponent implements ComponentInputsAsSignal<MultiSelectComponent> {
    readonly #formGroup = new FormGroup({
        value: new FormControl<unknown[]>([], { nonNullable: true, validators: [] })
    });
    readonly #formValue = toSignal(this.#formGroup.controls.value.valueChanges);
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly formGroup = this.#formGroup;
    protected readonly formValueText = computed(() => {
        const value = this.#formValue();
        const textField = this.textField();
        if (!value) {
            return "";
        }
        return aggregate(value, (acc, item) => `${acc}, ${getFormValueText(value, textField)}`, "");
    });
    protected readonly multiSelectData = computed(() => {
        const dataSet = this.features()["dataSet"].dropdownValue;
        if (dataSet === "Empty") {
            return [];
        }
        const virtualization = this.virtualization();
        if (!virtualization.enabled) {
            return dropdownFoodData;
        }
        return range(1, 10000)
            .select(i => {
                const item = dropdownFoodData[i % dropdownFoodData.length];
                return { ...item, value: i, text: `${item.text} => ${i}` };
            })
            .toArray();
    });
    protected readonly virtualization = computed(() => {
        const features = this.features();
        const subFeatures = features["virtualization"]?.subFeatures || {};
        const options: Partial<VirtualScrollOptions> = {
            enabled: features["virtualization"].active,
            height: subFeatures["itemHeight"].numericValue
        };
        return options;
    });

    public readonly data = input<ReturnType<MultiSelectComponent["data"]>>([]);
    public readonly disabled = model<ReturnType<MultiSelectComponent["disabled"]>>(false);
    public readonly itemDisabled = input<ReturnType<MultiSelectComponent["itemDisabled"]>>(() => false);
    public readonly rounded = input<ReturnType<MultiSelectComponent["rounded"]>>("medium");
    public readonly showClearButton = input<ReturnType<MultiSelectComponent["showClearButton"]>>(true);
    public readonly size = input<ReturnType<MultiSelectComponent["size"]>>("medium");
    public readonly summaryTagTemplate = input<ReturnType<MultiSelectComponent["summaryTagTemplate"]>>(null);
    public readonly tagCount = input<ReturnType<MultiSelectComponent["tagCount"]>>(-1);
    public readonly textField = input<ReturnType<MultiSelectComponent["textField"]>>("text");
    public readonly valueField = input<ReturnType<MultiSelectComponent["valueField"]>>("value");
}
