import { NgComponentOutlet } from "@angular/common";
import {
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    input,
    model,
    signal
} from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { disabled, form, FormField, readonly, required } from "@angular/forms/signals";
import { LucideList, LucideSearch } from "@lucide/angular";
import {
    DropdownButtonComponent,
    DropdownButtonItemComponent,
    DropdownButtonTextTemplateDirective
} from "@nanahoshi/mona-ui/dropdown-button";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import {
    TextBoxComponent,
    TextBoxPrefixTemplateDirective,
    TextBoxSuffixTemplateDirective
} from "@nanahoshi/mona-ui/text-box";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-text-box-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./text-box-demo.component.html"
})
export class TextBoxDemoComponent extends AbstractDemoComponent<TextBoxComponent> {
    readonly #injector = createFeatureInjector({
        prefixTemplate: {
            active: false,
            description: `This template is used to customize the prefix of the text box.`,
            name: "Prefix Template"
        },
        suffixTemplate: {
            active: false,
            description: `This template is used to customize the suffix of the text box.`,
            name: "Suffix Template"
        }
    });
    protected readonly TextBoxWrapperComponent = TextBoxWrapperComponent;
    protected readonly config = computed<ComponentConfig<TextBoxComponent>>(() => ({
        inputs: deriveInputConfig<TextBoxComponent>(this.metadata(), {
            inputClass: {
                type: "string",
                value: ""
            },
            inputStyle: {
                type: "string",
                value: ""
            },
            // invalid, touched, name, maxLength and minLength are written by the FormField directive via
            // [formField] below; Angular forbids binding them directly, so exclude them rather than expose a dead control.
            invalid: undefined,
            maxLength: undefined,
            minLength: undefined,
            name: undefined,
            touched: undefined,
            // The demo labels the text box with a visible <mona-label> pointed at a fixed inputId.
            ariaDescribedBy: undefined,
            ariaLabel: undefined,
            ariaLabelledBy: undefined,
            inputId: undefined,
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
            type: {
                type: "dropdown",
                value: ["text", "password", "email", "search", "tel", "url"],
                defaultValue: "text"
            },
            userClass: {
                alias: "class",
                type: "string",
                value: ""
            }
        }),
        featureHandler: this.#injector.get(FeatureConfigHandler)
    }));
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("TextBoxComponent");
}

@Component({
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        TextBoxComponent,
        TextBoxPrefixTemplateDirective,
        TextBoxSuffixTemplateDirective,
        DropdownButtonComponent,
        DropdownButtonItemComponent,
        ReactiveFormsModule,
        DropdownButtonTextTemplateDirective,
        LucideSearch,
        LucideList,
        FormField,
        LabelComponent
    ],
    template: `
        @let featureData = features();
        <div class="flex flex-col gap-2">
            <span>Value: {{ form.text().value() }}</span>
            <mona-label for="text-box-demo-input" text="Name"></mona-label>
            <mona-text-box
                inputId="text-box-demo-input"
                [clearButton]="clearButton()"
                [size]="size()"
                [inputClass]="inputClass()"
                [inputStyle]="inputStyle()"
                [placeholder]="placeholder()"
                [rounded]="rounded()"
                [type]="type()"
                [formField]="form.text"
                (inputBlur)="onInputBlur($event)"
                (inputFocus)="onInputFocus($event)"
                [class]="'w-48 ' + userClass()">
                @if (featureData && featureData["prefixTemplate"].active) {
                    <ng-template monaTextBoxPrefixTemplate>
                        <svg lucideSearch [size]="20" class="pl-1"></svg>
                    </ng-template>
                }
                @if (featureData && featureData["suffixTemplate"].active) {
                    <ng-template monaTextBoxSuffixTemplate>
                        <mona-dropdown-button look="ghost" [iconOnly]="true" [rounded]="'none'" class="h-full">
                            <ng-template monaDropdownButtonTextTemplate>
                                <svg lucideList [size]="16"></svg>
                            </ng-template>
                            <mona-dropdown-button-item label="Menu Item 1"></mona-dropdown-button-item>
                            <mona-dropdown-button-item label="Menu Item 2"></mona-dropdown-button-item>
                        </mona-dropdown-button>
                    </ng-template>
                }
            </mona-text-box>
        </div>
    `
})
export class TextBoxWrapperComponent implements ComponentInputsAsSignal<TextBoxComponent> {
    readonly #formModel = signal<FormModel>({ text: "" });
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly form = form(this.#formModel, schema => {
        disabled(schema.text, { when: () => this.disabled() });
        readonly(schema.text, { when: () => this.readonly() });
        required(schema.text, { when: () => this.required() });
    });
    public readonly clearButton = input(false, { transform: booleanAttribute });
    public readonly disabled = input(false, { transform: booleanAttribute });
    public readonly inputClass = input<string | string[]>("");
    public readonly inputStyle = input<string | Partial<CSSStyleDeclaration> | null>("");
    public readonly placeholder = input("");
    public readonly readonly = input(false, { transform: booleanAttribute });
    public readonly required = input(false, { transform: booleanAttribute });
    public readonly rounded = input<ReturnType<TextBoxComponent["rounded"]>>("medium");
    public readonly size = input<ReturnType<TextBoxComponent["size"]>>("medium");
    public readonly type = input<ReturnType<TextBoxComponent["type"]>>("text");
    public readonly userClass = input<ReturnType<TextBoxComponent["userClass"]>>("");
    public readonly value = model<string>("");

    public constructor() {
        effect(() => {
            this.form.text().value.set(this.value());
        });
    }

    protected readonly onInputBlur = (event: FocusEvent) => {
        console.log("Input blurred:", event);
    };
    protected readonly onInputFocus = (event: FocusEvent) => {
        console.log("Input focused:", event);
    };
}

interface FormModel {
    text: string;
}
