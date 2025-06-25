import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, model, signal } from "@angular/core";
import { ButtonGroupComponent, ButtonGroupItemComponent } from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-button-group-demo",
    imports: [NgComponentOutlet, DemoContainerComponent],
    templateUrl: "./button-group-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonGroupDemoComponent extends AbstractDemoComponent<ButtonGroupComponent> {
    protected readonly ButtonGroupComponent = ButtonGroupComponent;
    protected readonly ButtonGroupWrapperComponent = ButtonGroupWrapperComponent;
    protected readonly config = signal<ComponentConfig<ButtonGroupComponent>>({
        inputs: {
            disabled: {
                type: "boolean",
                description: "Disables the button group",
                value: false
            },
            look: {
                type: "dropdown",
                description: "Sets the look of the button group",
                value: ["default", "outline"],
                defaultValue: "outline"
            },
            selection: {
                type: "dropdown",
                description: "Sets the selection mode of the button group",
                value: ["single", "multiple"],
                defaultValue: "single"
            },
            size: {
                type: "dropdown",
                description: "Sets the size of the button group",
                value: ["default", "small", "large", "icon"],
                defaultValue: "default"
            }
        },
        outputs: {}
    });
    protected readonly metadata = this.getMetadata("ButtonGroupComponent");
}

@Component({
    imports: [ButtonGroupComponent, ButtonGroupItemComponent],
    template: `
        <mona-button-group [disabled]="disabled()" [selection]="selection()" [look]="look()" [size]="size()">
            <mona-button-group-item>B1</mona-button-group-item>
            <mona-button-group-item>B2</mona-button-group-item>
            <mona-button-group-item>B3</mona-button-group-item>
        </mona-button-group>
    `
})
export class ButtonGroupWrapperComponent implements ComponentInputsAsSignal<ButtonGroupComponent> {
    public readonly disabled = model(false);
    public readonly look = input<"default" | "outline">("default");
    public readonly selection = model<"single" | "multiple">("single");
    public readonly size = input<"default" | "small" | "large" | "icon">("default");
}
