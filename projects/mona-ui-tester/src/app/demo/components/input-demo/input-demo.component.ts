import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, signal } from "@angular/core";
import { TextBoxComponent, TextBoxDirective } from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-input-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./input-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InputDemoComponent extends AbstractDemoComponent<TextBoxDirective> {
    protected readonly InputWrapperComponent = InputWrapperComponent;
    protected readonly config = signal<ComponentConfig<TextBoxDirective>>({
        code: ``,
        inputs: {
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"],
                defaultValue: "medium"
            },
            size: {
                type: "dropdown",
                value: ["small", "medium", "large"],
                defaultValue: "medium"
            }
        },
        outputs: {}
    });
    protected readonly metadata = this.getMetadata("TextBoxDirective");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
}

@Component({
    imports: [TextBoxDirective],
    template: ` <input type="email" [rounded]="rounded()" [size]="size()" monaTextBox /> `
})
export class InputWrapperComponent implements ComponentInputsAsSignal<TextBoxDirective> {
    public readonly rounded = input<ReturnType<TextBoxDirective["rounded"]>>("medium");
    public readonly size = input<ReturnType<TextBoxDirective["size"]>>("medium");
}
