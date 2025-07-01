import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, signal } from "@angular/core";
import { TextAreaDirective } from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-text-area-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./text-area-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
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
        },
        outputs: {}
    });
    protected readonly metadata = this.getMetadata("TextAreaDirective");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly TextAreaWrapperComponent = TextAreaWrapperComponent;
}

@Component({
    template: ` <textarea monaTextArea [rounded]="rounded()" class="w-144 h-32 resize-none"></textarea> `,
    imports: [TextAreaDirective]
})
export class TextAreaWrapperComponent implements ComponentInputsAsSignal<TextAreaDirective> {
    public readonly rounded = input<ReturnType<TextAreaDirective["rounded"]>>("medium");
}
