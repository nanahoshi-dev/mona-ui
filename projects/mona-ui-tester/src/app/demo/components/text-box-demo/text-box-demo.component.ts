import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, signal } from "@angular/core";
import { TextBoxComponent } from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-text-box-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./text-box-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextBoxDemoComponent extends AbstractDemoComponent<TextBoxComponent> {
    protected readonly TextBoxWrapperComponent = TextBoxWrapperComponent;
    protected readonly config = signal<ComponentConfig<TextBoxComponent>>({
        code: ``,
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
                value: "text"
            },
            inputStyle: {
                type: "string",
                value: ""
            },
            placeholder: {
                type: "string",
                value: "Enter text here"
            },
            readonly: {
                type: "boolean",
                value: false
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
        outputs: {
            inputBlur: {
                type: "event"
            },
            inputFocus: {
                type: "event"
            }
        }
    });
    protected readonly metadata = this.getMetadata("TextBoxComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
}

@Component({
    imports: [TextBoxComponent],
    template: `
        <mona-text-box
            [clearButton]="clearButton()"
            [disabled]="disabled()"
            [size]="size()"
            [inputStyle]="inputStyle()"
            [type]="type()"
            [readonly]="readonly()"
            [placeholder]="placeholder()"
            (inputBlur)="onInputBlur($event)"
            (inputFocus)="onInputFocus($event)">
        </mona-text-box>
    `
})
export class TextBoxWrapperComponent implements ComponentInputsAsSignal<TextBoxComponent> {
    public readonly clearButton = input(false);
    public readonly disabled = input(false);
    public readonly inputClass = input<string | string[]>("text");
    public readonly inputStyle = input<string | Partial<CSSStyleDeclaration> | null>("");
    public readonly placeholder = input("Enter text here");
    public readonly readonly = input(false);
    public readonly size = input<ReturnType<TextBoxComponent["size"]>>("medium");
    public readonly type = input<ReturnType<TextBoxComponent["type"]>>("text");
    public readonly onInputBlur = (event: Event) => {
        console.log("Input blurred:", event);
    };
    public readonly onInputFocus = (event: Event) => {
        console.log("Input focused:", event);
    };
}
