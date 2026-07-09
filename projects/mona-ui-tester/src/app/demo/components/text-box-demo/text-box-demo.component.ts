import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, effect, inject, input, model, signal } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { disabled, form, FormField, readonly, required } from "@angular/forms/signals";
import { LucideList, LucideSearch } from "@lucide/angular";
import {
    DropdownButtonComponent,
    DropdownButtonItemComponent,
    DropdownButtonTextTemplateDirective
} from "@nanahoshi/mona-ui/dropdown-button";
import {
    TextBoxComponent,
    TextBoxPrefixTemplateDirective,
    TextBoxSuffixTemplateDirective
} from "@nanahoshi/mona-ui/text-box";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
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
    protected readonly config = signal<ComponentConfig<TextBoxComponent>>({
        inputs: {
            clearButton: {
                type: "boolean",
                value: false
            },
            disabled: {
                type: "boolean",
                value: false
            },
            inputClass: {
                type: "string",
                value: ""
            },
            inputStyle: {
                type: "string",
                value: ""
            },
            placeholder: {
                type: "string",
                value: ""
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
            value: {
                type: "string",
                value: ""
            },
            type: {
                type: "dropdown",
                value: ["text", "password", "email"], // Add more types as needed
                defaultValue: "text"
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("TextBoxComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
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
        FormField
    ],
    template: `
        @let featureData = features();
        <div class="flex flex-col gap-2">
            <span>Value: {{ form.text().value() }}</span>
            <mona-text-box
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
                class="w-48">
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
    public readonly clearButton = input(false);
    public readonly disabled = input(false);
    public readonly inputClass = input<string | string[]>("");
    public readonly inputStyle = input<string | Partial<CSSStyleDeclaration> | null>("");
    public readonly placeholder = input("");
    public readonly readonly = input(false);
    public readonly required = input(false);
    public readonly rounded = input<ReturnType<TextBoxComponent["rounded"]>>("medium");
    public readonly size = input<ReturnType<TextBoxComponent["size"]>>("medium");
    public readonly type = input<ReturnType<TextBoxComponent["type"]>>("text");
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
