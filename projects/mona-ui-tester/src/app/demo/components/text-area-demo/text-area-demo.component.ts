import { NgComponentOutlet } from "@angular/common";
import { Component, input, signal } from "@angular/core";
import { form, FormField } from "@angular/forms/signals";
import { TextAreaDirective } from "@nanahoshi/mona-ui/text-area";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-text-area-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./text-area-demo.component.html"
})
export class TextAreaDemoComponent extends AbstractDemoComponent<TextAreaDirective> {
    protected readonly config = signal<ComponentConfig<TextAreaDirective>>({
        code: `<textarea monaTextArea [rounded]="rounded()"></textarea>`,
        inputs: {
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large"],
                defaultValue: "medium"
            }
        }
    });
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
                class="w-144 h-32 resize-none"></textarea>
        </div>
    `,
    imports: [TextAreaDirective, FormField]
})
export class TextAreaWrapperComponent implements ComponentInputsAsSignal<TextAreaDirective> {
    readonly #formModel = signal<TextAreaFormModel>({ longText: "" });
    protected readonly form = form(this.#formModel);
    public readonly rounded = input<ReturnType<TextAreaDirective["rounded"]>>("medium");
}

interface TextAreaFormModel {
    longText: string;
}
