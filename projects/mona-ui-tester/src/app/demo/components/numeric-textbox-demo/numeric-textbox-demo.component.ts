import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, model, signal } from "@angular/core";
import { disabled, form, FormField, readonly, required } from "@angular/forms/signals";
import { LucideHash } from "@lucide/angular";
import { NumericTextBoxComponent, NumericTextBoxPrefixTemplateDirective } from "@nanahoshi/mona-ui/numeric-text-box";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-numeric-textbox-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./numeric-textbox-demo.component.html"
})
export class NumericTextboxDemoComponent extends AbstractDemoComponent<NumericTextBoxComponent> {
    readonly #injector = createFeatureInjector({
        formatter: {
            code: `
                (value: number | null) => value == null ? "" : \`$ \${value.toString()}\`
            `,
            description: `This formatter function formats the numeric value as a currency string.`,
            name: "Formatter",
            active: false
        },
        prefixTemplate: {
            code: `

            `,
            description: `This template is used to customize the prefix of the numeric text box.`,
            name: "Prefix Template",
            active: false
        }
    });
    protected readonly config = signal<ComponentConfig<NumericTextBoxComponent>>({
        code: `

        `,
        inputs: {
            decimals: {
                type: "number",
                value: 2
            },
            disabled: {
                type: "boolean",
                value: false
            },
            formatter: {
                type: "function",
                value: (value: number | null) => (value == null ? "" : `$ ${value.toString()}`)
            },
            maxValue: {
                type: "number",
                value: 100,
                nullable: true
            },
            minValue: {
                type: "number",
                value: 0,
                nullable: true
            },
            nullable: {
                type: "boolean",
                value: false
            },
            readonly: {
                type: "boolean",
                value: false
            },
            required: {
                type: "boolean",
                value: false
            },
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"],
                defaultValue: "medium"
            },
            size: {
                type: "dropdown",
                value: ["small", "medium", "large"],
                defaultValue: "medium"
            },
            spinners: {
                type: "boolean",
                value: true
            },
            step: {
                type: "number",
                value: 1
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("NumericTextBoxComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly NumericTextboxWrapperComponent = NumericTextboxWrapperComponent;
}

@Component({
    imports: [NumericTextBoxComponent, NumericTextBoxPrefixTemplateDirective, LucideHash, FormField],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        @let featureData = features();
        <div class="flex flex-col gap-2">
            <span>Value: {{ form.amount().value() }}</span>
            <mona-numeric-text-box
                [decimals]="decimals()"
                [formatter]="formatterFn()"
                [maxValue]="maxValue()"
                [minValue]="minValue()"
                [nullable]="nullable()"
                [rounded]="rounded()"
                [size]="size()"
                [spinners]="spinners()"
                [step]="step()"
                [formField]="form.amount"
                class="w-40">
                @if (featureData && featureData["prefixTemplate"].active) {
                    <ng-template monaNumericTextBoxPrefixTemplate>
                        <svg lucideHash [size]="16" class="mx-0.5"></svg>
                    </ng-template>
                }
            </mona-numeric-text-box>
        </div>
    `
})
export class NumericTextboxWrapperComponent implements ComponentInputsAsSignal<NumericTextBoxComponent> {
    readonly #formModel = signal<FormModel>({ amount: null });
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly formatterFn = computed(() => {
        const featureData = this.features();
        return featureData && featureData["formatter"].active
            ? (value: number | null) => (value == null ? "" : `$ ${value}`)
            : null;
    });
    protected readonly form = form(this.#formModel, schema => {
        disabled(schema.amount, { when: () => this.disabled() });
        readonly(schema.amount, { when: () => this.readonly() });
        required(schema.amount, { when: () => this.required() });
    });
    public readonly decimals = input(0);
    public readonly disabled = input(false);
    public readonly formatter = input<ReturnType<NumericTextBoxComponent["formatter"]>>(this.formatterFn());
    public readonly maxValue = input<number | null>(null);
    public readonly minValue = input<number | null>(null);
    public readonly nullable = input(false);
    public readonly readonly = input(false);
    public readonly required = input(false);
    public readonly rounded = input<ReturnType<NumericTextBoxComponent["rounded"]>>(`medium`);
    public readonly size = input<ReturnType<NumericTextBoxComponent["size"]>>("medium");
    public readonly spinners = input(true);
    public readonly step = input(1);
    public readonly value = model<number | null>(null);

    public constructor() {
        effect(() => {
            this.form.amount().value.set(this.value());
        });
    }
}

interface FormModel {
    amount: number | null;
}
