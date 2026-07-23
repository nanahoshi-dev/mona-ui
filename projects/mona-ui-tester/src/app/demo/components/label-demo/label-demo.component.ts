import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, signal } from "@angular/core";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-label-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./label-demo.component.html"
})
export class LabelDemoComponent extends AbstractDemoComponent<LabelComponent> {
    protected readonly config = signal<ComponentConfig<LabelComponent>>({
        code: ``,
        inputs: {
            text: {
                type: "string",
                value: "Email address"
            },
            optional: {
                type: "boolean",
                value: false
            },
            optionalText: {
                type: "string",
                value: "Optional"
            }
        }
    });
    protected readonly LabelWrapperComponent = LabelWrapperComponent;
    protected readonly metadata = this.getMetadata("LabelComponent");
}

@Component({
    imports: [LabelComponent, TextBoxComponent],
    template: `
        <mona-label [text]="text()" [optional]="optional()" [optionalText]="optionalText()">
            <mona-text-box placeholder="Enter an email address"></mona-text-box>
        </mona-label>
    `,
    host: {
        class: "w-full flex items-center justify-center"
    }
})
class LabelWrapperComponent implements ComponentInputsAsSignal<LabelComponent> {
    public readonly optional = input<ReturnType<LabelComponent["optional"]>>(false);
    public readonly optionalText = input<ReturnType<LabelComponent["optionalText"]>>("Optional");
    public readonly text = input<ReturnType<LabelComponent["text"]>>("Email address");
}
