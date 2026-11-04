import { NgComponentOutlet } from "@angular/common";
import { booleanAttribute, Component, computed, effect, inject, input, model, signal } from "@angular/core";
import { disabled, form, FormField, readonly, required } from "@angular/forms/signals";
import { LucideHash } from "@lucide/angular";
import { DecimalTextBoxComponent, NumericTextBoxPrefixTemplateDirective } from "@nanahoshi/mona-ui/numeric-text-box";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

const PREFIX_TEMPLATE_CODE = `<ng-template monaNumericTextBoxPrefixTemplate>
    <svg lucideHash [size]="16" class="mx-0.5"></svg>
</ng-template>`;

@Component({
    selector: "app-decimal-textbox-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./decimal-textbox-demo.component.html"
})
export class DecimalTextboxDemoComponent extends AbstractDemoComponent<DecimalTextBoxComponent> {
    readonly #injector = createFeatureInjector({
        formatter: {
            code: `
                (value: string | null) => value == null ? "" : \`$ \${value}\`
            `,
            description: `This formatter function prefixes the decimal value with a currency sign.`,
            name: "Formatter",
            active: false
        },
        prefixTemplate: {
            code: PREFIX_TEMPLATE_CODE,
            description: `This template is used to customize the prefix of the decimal text box.`,
            name: "Prefix Template",
            active: false
        }
    });
    protected readonly config = computed<ComponentConfig<DecimalTextBoxComponent>>(() => ({
        inputs: deriveInputConfig<DecimalTextBoxComponent>(this.metadata(), {
            decimals: {
                type: "number",
                value: 2
            },
            formatter: {
                type: "function",
                value: (value: string | null) => (value == null ? "" : `$ ${value}`)
            },
            // invalid/touched are written by the FormField directive via [formField] below;
            // Angular forbids binding them directly, so exclude them rather than expose a dead control.
            invalid: undefined,
            maxValue: {
                type: "string",
                value: "99999999999999999999.99"
            },
            minValue: {
                type: "string",
                value: "0"
            },
            nullable: {
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
            step: {
                type: "string",
                value: "0.01"
            },
            touched: undefined,
            userClass: {
                alias: "class",
                type: "string",
                value: "w-72"
            }
        }),
        featureHandler: this.#injector.get(FeatureConfigHandler)
    }));
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("DecimalTextBoxComponent");
    protected readonly wrapperComponent = DecimalTextboxWrapperComponent;
}

@Component({
    imports: [DecimalTextBoxComponent, NumericTextBoxPrefixTemplateDirective, LucideHash, FormField],
    template: `
        @let featureData = features();
        <div class="flex flex-col gap-2">
            <span>Value: {{ form.amount().value() }}</span>
            <mona-decimal-text-box
                [decimals]="decimals()"
                [formatter]="formatterFn()"
                [maxValue]="maxValue()"
                [minValue]="minValue()"
                [nullable]="nullable()"
                [rounded]="rounded()"
                [size]="size()"
                [spinners]="spinners()"
                [step]="step()"
                [tabindex]="tabindex()"
                [formField]="form.amount"
                [class]="userClass()"
                aria-label="Amount">
                @if (featureData && featureData["prefixTemplate"].active) {
                    <ng-template monaNumericTextBoxPrefixTemplate>
                        <svg lucideHash [size]="16" class="mx-0.5"></svg>
                    </ng-template>
                }
            </mona-decimal-text-box>
        </div>
    `
})
export class DecimalTextboxWrapperComponent implements ComponentInputsAsSignal<DecimalTextBoxComponent> {
    readonly #formModel = signal<FormModel>({ amount: null });
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly form = form(this.#formModel, schema => {
        disabled(schema.amount, { when: () => this.disabled() });
        readonly(schema.amount, { when: () => this.readonly() });
        required(schema.amount, { when: () => this.required() });
    });
    protected readonly formatterFn = computed(() => {
        const featureData = this.features();
        return featureData && featureData["formatter"].active
            ? (value: string | null) => (value == null ? "" : `$ ${value}`)
            : null;
    });
    public readonly decimals = input(0);
    public readonly disabled = input(false, { transform: booleanAttribute });
    public readonly formatter = input<ReturnType<DecimalTextBoxComponent["formatter"]>>(this.formatterFn());
    public readonly maxValue = input<string | null, string | number | null>(null, { transform: toOptionalString });
    public readonly minValue = input<string | null, string | number | null>(null, { transform: toOptionalString });
    public readonly nullable = input(false, { transform: booleanAttribute });
    public readonly readonly = input(false, { transform: booleanAttribute });
    public readonly required = input(false, { transform: booleanAttribute });
    public readonly rounded = input<ReturnType<DecimalTextBoxComponent["rounded"]>>(`medium`);
    public readonly size = input<ReturnType<DecimalTextBoxComponent["size"]>>("medium");
    public readonly spinners = input(true, { transform: booleanAttribute });
    public readonly step = input<string, string | number>("1", { transform: String });
    public readonly tabindex = input(0);
    public readonly userClass = input("w-72");
    public readonly value = model<string | null>(null);

    public constructor() {
        effect(() => {
            this.form.amount().value.set(this.value());
        });
    }
}

function toOptionalString(value: string | number | null): string | null {
    return value == null ? null : String(value);
}

interface FormModel {
    amount: string | null;
}
