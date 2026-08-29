import { NgComponentOutlet } from "@angular/common";
import { Component, computed, input, signal } from "@angular/core";
import { form, FormField } from "@angular/forms/signals";
import { TextBoxDirective } from "@nanahoshi/mona-ui/text-box";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-input-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./input-demo.component.html"
})
export class InputDemoComponent extends AbstractDemoComponent<TextBoxDirective> {
    protected readonly InputWrapperComponent = InputWrapperComponent;
    protected readonly config = computed<ComponentConfig<TextBoxDirective>>(() => ({
        inputs: deriveInputConfig<TextBoxDirective>(this.metadata(), {
            // invalid/touched are written by the FormField directive via [formField] below;
            // Angular forbids binding them directly, so exclude them rather than expose a dead control.
            invalid: undefined,
            touched: undefined,
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
            userClass: {
                alias: "class",
                type: "string",
                value: ""
            }
        })
    }));
    protected readonly metadata = this.getMetadata("TextBoxDirective");
}

@Component({
    imports: [TextBoxDirective, FormField],
    template: `
        <div class="flex flex-col gap-2">
            <span>Value: {{ form.text().value() }}</span>
            <input
                type="text"
                [rounded]="rounded()"
                [size]="size()"
                [formField]="form.text"
                [class]="userClass()"
                monaTextBox />
        </div>
    `
})
export class InputWrapperComponent implements ComponentInputsAsSignal<TextBoxDirective> {
    readonly #formModel = signal<FormModel>({ text: "" });
    protected readonly form = form(this.#formModel);
    public readonly rounded = input<ReturnType<TextBoxDirective["rounded"]>>("medium");
    public readonly size = input<ReturnType<TextBoxDirective["size"]>>("medium");
    public readonly userClass = input<ReturnType<TextBoxDirective["userClass"]>>("");
}

interface FormModel {
    text: string;
}
