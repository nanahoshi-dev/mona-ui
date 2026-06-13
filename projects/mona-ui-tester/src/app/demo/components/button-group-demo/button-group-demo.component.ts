import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, model, signal } from "@angular/core";
import { ButtonDirective, ButtonGroupComponent } from "mona-ui";
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
    protected readonly ButtonGroupWrapperComponent = ButtonGroupWrapperComponent;
    protected readonly config = signal<ComponentConfig<ButtonGroupComponent>>({
        code: `
            <mona-button-group
                [allowEmpty]="allowEmpty()"
                [disabled]="disabled()"
                [selection]="selection()"
                [look]="look()"
                [rounded]="rounded()"
                [size]="size()">
                <button monaButton>B1</button>
                <button monaButton>B2</button>
                <button monaButton>B3</button>
            </mona-button-group>
        `,
        inputs: {
            allowEmpty: {
                type: "boolean",
                value: true
            },
            disabled: {
                type: "boolean",
                value: false
            },
            look: {
                type: "dropdown",
                value: ["default", "outline", "primary", "secondary", "success", "error", "warning", "info", "ghost"],
                defaultValue: "default"
            },
            rounded: {
                type: "dropdown",
                value: ["small", "medium", "large", "full", "none"],
                defaultValue: "medium"
            },
            selection: {
                type: "dropdown",
                value: ["single", "multiple"],
                defaultValue: "single"
            },
            size: {
                type: "dropdown",
                value: ["medium", "small", "large"],
                defaultValue: "medium"
            }
        }
    });
    protected readonly metadata = this.getMetadata("ButtonGroupComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
}

@Component({
    imports: [ButtonGroupComponent, ButtonDirective],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        <mona-button-group
            [allowEmpty]="allowEmpty()"
            [disabled]="disabled()"
            [selection]="selection()"
            [look]="look()"
            [rounded]="rounded()"
            [size]="size()">
            <button monaButton>B1</button>
            <button monaButton>B2</button>
            <button monaButton>B3</button>
        </mona-button-group>
    `
})
export class ButtonGroupWrapperComponent implements ComponentInputsAsSignal<ButtonGroupComponent> {
    public readonly allowEmpty = input<ReturnType<ButtonGroupComponent["allowEmpty"]>>(true);
    public readonly disabled = model<ReturnType<ButtonGroupComponent["disabled"]>>(false);
    public readonly look = input<ReturnType<ButtonGroupComponent["look"]>>("default");
    public readonly rounded = input<ReturnType<ButtonGroupComponent["rounded"]>>("medium");
    public readonly selection = model<ReturnType<ButtonGroupComponent["selection"]>>("single");
    public readonly size = input<ReturnType<ButtonGroupComponent["size"]>>("medium");
}
