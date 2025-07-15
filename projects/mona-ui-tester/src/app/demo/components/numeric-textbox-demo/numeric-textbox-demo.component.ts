import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { Hash, LucideAngularModule } from "lucide-angular";
import { NumericTextBoxComponent, NumericTextBoxPrefixTemplateDirective } from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-numeric-textbox-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./numeric-textbox-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
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
                <ng-template monaNumericTextBoxPrefixTemplate>
                    <lucide-icon [name]="Hash" [size]="16" class="mx-0.5"></lucide-icon>
                </ng-template>
            `,
            description: `This template is used to customize the prefix of the numeric text box.`,
            name: "Prefix Template",
            active: false
        }
    });
    protected readonly config = signal<ComponentConfig<NumericTextBoxComponent>>({
        code: `
            <mona-numeric-text-box
                [decimals]="decimals()"
                [disabled]="disabled()"
                [formatter]="formatter()"
                [max]="max()"
                [min]="min()"
                [nullable]="nullable()"
                [readonly]="readonly()"
                [required]="required()"
                [rounded]="rounded()"
                [size]="size()"
                [spinners]="spinners()"
                [step]="step()"
                class="w-40">
                <ng-template monaNumericTextBoxPrefixTemplate>
                    <lucide-icon [name]="Hash" [size]="16" class="mx-0.5"></lucide-icon>
                </ng-template>
            </mona-numeric-text-box>
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
            max: {
                type: "number",
                value: 100,
                nullable: true
            },
            min: {
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
        outputs: {
            inputBlur: {
                type: "event"
            },
            inputFocus: {
                type: "event"
            },
            inputFocusOut: {
                type: "event"
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
    imports: [NumericTextBoxComponent, NumericTextBoxPrefixTemplateDirective, LucideAngularModule, ReactiveFormsModule],
    template: `
        @let featureData = features();
        <mona-numeric-text-box
            [decimals]="decimals()"
            [disabled]="disabled()"
            [formatter]="formatterFn()"
            [max]="max()"
            [min]="min()"
            [nullable]="nullable()"
            [readonly]="readonly()"
            [required]="required()"
            [rounded]="rounded()"
            [size]="size()"
            [spinners]="spinners()"
            [step]="step()"
            class="w-40">
            @if (featureData && featureData["prefixTemplate"].active) {
                <ng-template monaNumericTextBoxPrefixTemplate>
                    <lucide-icon [name]="Hash" [size]="16" class="mx-0.5"></lucide-icon>
                </ng-template>
            }
        </mona-numeric-text-box>
    `
})
export class NumericTextboxWrapperComponent implements ComponentInputsAsSignal<NumericTextBoxComponent> {
    protected readonly Hash = Hash;
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly formatterFn = computed(() => {
        const featureData = this.features();
        return featureData && featureData["formatter"].active
            ? (value: number | null) => (value == null ? "" : `$ ${value}`)
            : null;
    });
    public readonly decimals = input(0);
    public readonly disabled = input(false);
    public readonly formatter = input<ReturnType<NumericTextBoxComponent["formatter"]>>(this.formatterFn());
    public readonly max = input<number | null>(null);
    public readonly min = input<number | null>(null);
    public readonly nullable = input(false);
    public readonly readonly = input(false);
    public readonly required = input(false);
    public readonly rounded = input<ReturnType<NumericTextBoxComponent["rounded"]>>(`medium`);
    public readonly size = input<ReturnType<NumericTextBoxComponent["size"]>>("medium");
    public readonly spinners = input(true);
    public readonly step = input(1);
}
