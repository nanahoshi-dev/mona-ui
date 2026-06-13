import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, signal } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { List, LucideAngularModule, Search } from "lucide-angular";
import {
    DropdownButtonComponent,
    DropdownButtonItemComponent,
    DropdownButtonTextTemplateDirective,
    MenuItemComponent,
    TextBoxComponent,
    TextBoxPrefixTemplateDirective,
    TextBoxSuffixTemplateDirective
} from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-text-box-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./text-box-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextBoxDemoComponent extends AbstractDemoComponent<TextBoxComponent> {
    readonly #injector = createFeatureInjector({
        prefixTemplate: {
            active: false,
            code: `
                <ng-template monaTextBoxPrefixTemplate>
                    <lucide-angular [name]="searchIcon" [size]="20" class="pl-1"></lucide-angular>
                </ng-template>
            `,
            description: `This template is used to customize the prefix of the text box.`,
            name: "Prefix Template"
        },
        suffixTemplate: {
            active: false,
            code: `
                <ng-template monaTextBoxSuffixTemplate>
                    <mona-drop-down-button look="ghost" [iconOnly]="true" [rounded]="'none'" class="h-full">
                        <lucide-angular [name]="listIcon" [size]="16"></lucide-angular>
                        <mona-menu-item text="Menu Item 1"></mona-menu-item>
                        <mona-menu-item text="Menu Item 2"></mona-menu-item>
                    </mona-drop-down-button>
                </ng-template>
            `,
            description: `This template is used to customize the suffix of the text box.`,
            name: "Suffix Template"
        }
    });
    protected readonly TextBoxWrapperComponent = TextBoxWrapperComponent;
    protected readonly config = signal<ComponentConfig<TextBoxComponent>>({
        code: `
            <mona-text-box
                [clearButton]="clearButton()"
                [disabled]="disabled()"
                [size]="size()"
                [inputClass]="inputClass()"
                [inputStyle]="inputStyle()"
                [type]="type()"
                [readonly]="readonly()"
                [rounded]="rounded()"
                [placeholder]="placeholder()"
                (inputBlur)="onInputBlur($event)"
                (inputFocus)="onInputFocus($event)">
                <ng-template monaTextBoxPrefixTemplate>
                    <lucide-angular [name]="searchIcon" [size]="20" class="pl-1"></lucide-angular>
                </ng-template>
                <ng-template monaTextBoxSuffixTemplate>
                    <mona-drop-down-button look="ghost" [iconOnly]="true" [rounded]="'none'" class="h-full">
                        <lucide-angular [name]="listIcon" [size]="16"></lucide-angular>
                        <mona-menu-item text="Menu Item 1"></mona-menu-item>
                        <mona-menu-item text="Menu Item 2"></mona-menu-item>
                    </mona-drop-down-button>
                </ng-template>
            </mona-text-box>
        `,
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
    imports: [
        TextBoxComponent,
        TextBoxPrefixTemplateDirective,
        LucideAngularModule,
        TextBoxSuffixTemplateDirective,
        DropdownButtonComponent,
        DropdownButtonItemComponent,
        ReactiveFormsModule,
        DropdownButtonTextTemplateDirective
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        @let featureData = features();
        <mona-text-box
            [clearButton]="clearButton()"
            [disabled]="disabled()"
            [size]="size()"
            [inputClass]="inputClass()"
            [inputStyle]="inputStyle()"
            [type]="type()"
            [readonly]="readonly()"
            [rounded]="rounded()"
            [placeholder]="placeholder()"
            (inputBlur)="onInputBlur($event)"
            (inputFocus)="onInputFocus($event)"
            class="w-48">
            @if (featureData && featureData["prefixTemplate"].active) {
                <ng-template monaTextBoxPrefixTemplate>
                    <lucide-angular [name]="searchIcon" [size]="20" class="pl-1"></lucide-angular>
                </ng-template>
            }
            @if (featureData && featureData["suffixTemplate"].active) {
                <ng-template monaTextBoxSuffixTemplate>
                    <mona-dropdown-button look="ghost" [iconOnly]="true" [rounded]="'none'" class="h-full">
                        <ng-template monaDropdownButtonTextTemplate>
                            <lucide-angular [name]="listIcon" [size]="16"></lucide-angular>
                        </ng-template>
                        <mona-dropdown-button-item label="Menu Item 1"></mona-dropdown-button-item>
                        <mona-dropdown-button-item label="Menu Item 2"></mona-dropdown-button-item>
                    </mona-dropdown-button>
                </ng-template>
            }
        </mona-text-box>
    `
})
export class TextBoxWrapperComponent implements ComponentInputsAsSignal<TextBoxComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly listIcon = List;
    protected readonly searchIcon = Search;
    public readonly clearButton = input(false);
    public readonly disabled = input(false);
    public readonly inputClass = input<string | string[]>("");
    public readonly inputStyle = input<string | Partial<CSSStyleDeclaration> | null>("");
    public readonly placeholder = input("");
    public readonly readonly = input(false);
    public readonly rounded = input<ReturnType<TextBoxComponent["rounded"]>>("medium");
    public readonly size = input<ReturnType<TextBoxComponent["size"]>>("medium");
    public readonly type = input<ReturnType<TextBoxComponent["type"]>>("text");
    public readonly onInputBlur = (event: FocusEvent) => {
        console.log("Input blurred:", event);
    };
    public readonly onInputFocus = (event: FocusEvent) => {
        console.log("Input focused:", event);
    };
}
