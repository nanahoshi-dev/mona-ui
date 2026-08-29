import { NgComponentOutlet } from "@angular/common";
import { Component, computed, input, signal } from "@angular/core";
import { form, FormField } from "@angular/forms/signals";
import { TextAreaDirective } from "@nanahoshi/mona-ui/text-area";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-text-area-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./text-area-demo.component.html"
})
export class TextAreaDemoComponent extends AbstractDemoComponent<TextAreaDirective> {
    protected readonly config = computed<ComponentConfig<TextAreaDirective>>(() => ({
        inputs: deriveInputConfig<TextAreaDirective>(this.metadata(), {
            // invalid/touched are written by the FormField directive via [formField] above;
            // Angular forbids binding them directly, so exclude them rather than expose a dead control.
            invalid: undefined,
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large"],
                defaultValue: "medium"
            },
            touched: undefined,
            userClass: {
                alias: "class",
                type: "string",
                value: "w-144 h-32 resize-none"
            }
        })
    }));
    protected readonly metadata = this.getMetadata("TextAreaDirective");
    protected readonly TextAreaWrapperComponent = TextAreaWrapperComponent;
}

@Component({
    template: `
        <div class="flex flex-col gap-4">
            <span>Text: {{ form.longText().value() }}</span>
            <textarea
                monaTextArea
                [formField]="form.longText"
                [rounded]="rounded()"
                [class]="userClass()"></textarea>
        </div>
    `,
    imports: [TextAreaDirective, FormField]
})
export class TextAreaWrapperComponent implements ComponentInputsAsSignal<TextAreaDirective> {
    readonly #formModel = signal<TextAreaFormModel>({ longText: "" });
    protected readonly form = form(this.#formModel);
    public readonly rounded = input<ReturnType<TextAreaDirective["rounded"]>>("medium");
    public readonly userClass = input<ReturnType<TextAreaDirective["userClass"]>>("w-144 h-32 resize-none");
}

interface TextAreaFormModel {
    longText: string;
}
